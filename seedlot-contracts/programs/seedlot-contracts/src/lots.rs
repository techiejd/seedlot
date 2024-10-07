use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};

use crate::utils::{init_mint, InitMint, InitMintBumps, MintMetadata};
use crate::{Contract, Offers, SeedlotContractsError};

pub mod instructions {
    use crate::utils::{
        burn_frozen_tokens_from, get_token_metadata, get_value, mint_frozen_tokens_to,
        price_cents_2_usdc, price_string_2_cents, BurnFrozenTokensFrom, BurnFrozenTokensFromBumps,
        MintFrozenTokensTo, MintFrozenTokensToBumps,
    };

    use super::*;
    use anchor_spl::associated_token::{create, Create};
    use anchor_spl::token::{transfer, Transfer};

    pub fn prepare_lots(
        ctx: Context<PrepareLots>,
        order_index: u64,
        lot_quantity: u64,
        manager_for_lot: String,
    ) -> Result<()> {
        // Verify the order
        ctx.accounts
            .offers_account
            .load()?
            .verify_order(order_index, ctx.accounts.order_mint.key())?;

        // Get order metadata
        let order_token_metadata = get_token_metadata(&ctx.accounts.order_mint)?;

        // Extract location, variety, and price from order metadata
        let location = get_value(&order_token_metadata, "location")?;
        let variety = get_value(&order_token_metadata, "variety")?;
        let price = get_value(&order_token_metadata, "price")?;

        burn_frozen_tokens_from(
            Context::new(
                ctx.program_id,
                &mut &mut BurnFrozenTokensFrom {
                    authority: ctx.accounts.user.clone(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.order_mint.clone(),
                    from: ctx.accounts.user_order_token_account.clone(),
                    associated_token_program: ctx.accounts.associated_token_program.clone(),
                    token_program: ctx.accounts.token_program.clone(),
                },
                &[],
                BurnFrozenTokensFromBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            lot_quantity,
        )?;

        // Create new LOT mint
        let lot_mint_metadata = MintMetadata {
            name: format!("Seedlot Lot - {} {} {}", location, variety, manager_for_lot),
            symbol: "SL".to_string(),
            uri: format!("https://app.seedlot.io/lot/{}", manager_for_lot),
            location_variety_price: Some([location, variety, "".to_string()]),
            manager_for_lot: Some(manager_for_lot),
        };

        init_mint(
            Context::new(
                ctx.program_id,
                &mut InitMint {
                    payer: ctx.accounts.manager.clone(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.lot_mint.clone(),
                    rent: ctx.accounts.rent.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[],
                InitMintBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            &lot_mint_metadata,
        )?;

        // Create user lot token account
        create(CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            Create {
                payer: ctx.accounts.manager.to_account_info(),
                associated_token: ctx.accounts.user_lot_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
                mint: ctx.accounts.lot_mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ))?;

        mint_frozen_tokens_to(
            Context::new(
                ctx.program_id,
                &mut MintFrozenTokensTo {
                    authority: ctx.accounts.user.clone(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.lot_mint.to_account_info(),
                    to: ctx.accounts.user_lot_token_account.to_account_info(),
                    associated_token_program: ctx.accounts.associated_token_program.clone(),
                    token_program: ctx.accounts.token_program.clone(),
                },
                &[],
                MintFrozenTokensToBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            lot_quantity,
        )?;

        // Add the new lot to the lots account
        ctx.accounts.lots_account.load_mut()?.push(Lot {
            mint: ctx.accounts.lot_mint.key(),
            // We save the original price per tree in cents so that we can pay the right amount later even if the metadata price changes.
            original_price_per_tree: price_string_2_cents(&price)?,
        })?;

        // Calculate and transfer 10% of USDC to manager
        let price_in_usdc = price_cents_2_usdc(&price_string_2_cents(&price)?);
        let total_price = price_in_usdc * lot_quantity * ctx.accounts.contract.trees_per_lot;
        // TODO(techiejd): Remove hardcoded 10%, but for now it's a hackathon.
        let manager_fee = total_price / 10; // 10% of the total price

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program_standard.to_account_info(),
                Transfer {
                    from: ctx.accounts.contract_usdc_token_account.to_account_info(),
                    to: ctx.accounts.manager_usdc_token_account.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                },
                &[&[
                    b"contract",
                    ctx.accounts.contract.admin.as_ref(),
                    &[ctx.bumps.contract],
                ]],
            ),
            manager_fee,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PrepareLots<'info> {
    /// CHECK: This account is used for getting the associated token address only.
    pub user: AccountInfo<'info>,
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref()],
        bump,
        has_one = offers_account,
        has_one = lots_account,
        has_one = usdc_mint,
        constraint = contract.usdc_token_account.key() == contract_usdc_token_account.key(),
    )]
    pub contract: Account<'info, Contract>,
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut)]
    pub lots_account: AccountLoader<'info, Lots>,
    #[account(mut)]
    pub order_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = order_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_order_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub lot_mint: Signer<'info>,
    /// CHECK: I'd like to initialize it here but can't because the lot_mint is not yet initialized.
    #[account(mut)]
    pub user_lot_token_account: UncheckedAccount<'info>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = contract,
        associated_token::token_program = token_program_standard,
    )]
    pub contract_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = usdc_mint,
        associated_token::authority = manager,
        associated_token::token_program = token_program_standard,
    )]
    pub manager_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub token_program_standard: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum LotState {
    Preparation,
    Growing,
    Ready,
    Shipped,
}

#[zero_copy]
pub struct Lot {
    pub mint: Pubkey,
    pub original_price_per_tree: u64,
}

impl Lot {
    pub const LEN: usize = 32 // key
     + 8; // original_price_per_tree.
}

const _TOTAL_LOTS: usize = 10_000;

#[account(zero_copy)]
#[repr(C)]
pub struct Lots {
    pub owner: Pubkey,
    pub tail: u64,
    pub lots: [Lot; _TOTAL_LOTS],
}

impl Lots {
    pub const TOTAL_LOTS: u64 = _TOTAL_LOTS as u64;
    pub const LEN: usize = 8 // Discriminator
    + 32 // owner
    + 8 // tail
    + (Lot::LEN * Self::TOTAL_LOTS as usize);

    pub fn push(&mut self, lot: Lot) -> Result<()> {
        require_neq!(self.tail, Self::TOTAL_LOTS, SeedlotContractsError::LotsFull);
        self.lots[self.tail as usize] = lot;
        self.tail += 1;
        Ok(())
    }
}
