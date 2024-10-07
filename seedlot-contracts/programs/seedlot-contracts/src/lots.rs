use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_program::program_option::COption;

use crate::utils::{init_mint, InitMint, InitMintBumps, MintMetadata};
use crate::{Contract, Offers, SeedlotContractsError};
/*
pub mod instructions {
    use crate::utils::{get_token_metadata, get_value};

    use super::*;
    use anchor_spl::token::{burn, transfer, Burn, Transfer};
    use anchor_spl::token_2022::{mint_to, MintTo};
    use spl_token_2022::extension::{BaseStateWithExtensions, PodStateWithExtensions};
    use spl_token_2022::pod::PodMint;
    use spl_token_metadata_interface::state::TokenMetadata;

    pub fn prepare_lot(
        ctx: Context<PrepareLot>,
        order_index: u64,
        order_quantity: u64,
    ) -> Result<()> {
        // Verify the order
        ctx.accounts
            .offers_account
            .load()?
            .verify_order(order_index, ctx.accounts.order_mint.key())?;

        // Get order metadata
        let order_token_metadata = get_token_metadata(&ctx.accounts.order_mint.to_account_info())?;

        // Extract location, variety, and price from order metadata
        let location = get_value(&order_token_metadata, "location")?;
        let variety = get_value(&order_token_metadata, "variety")?;
        let price = get_value(&order_token_metadata, "price")?;

        // Burn order tokens
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.order_mint.to_account_info(),
                from: ctx.accounts.user_order_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        burn(burn_ctx, order_quantity)?;

        // Create new LOT mint
        let lot_mint_metadata = MintMetadata {
            name: format!("LOT - {} {}", location, variety),
            symbol: "LOT".to_string(),
            uri: "https://example.com/lot/".to_string(),
            location_variety_price: Some([
                location,
                variety,
                ctx.accounts.manager.key().to_string(),
                "Preparation".to_string(),
            ]),
        };

        init_mint(
            Context::new(
                ctx.program_id,
                &mut InitMint {
                    admin: ctx.accounts.manager.to_account_info(),
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

        // Mint LOT tokens to user
        let mint_to_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.lot_mint.to_account_info(),
                to: ctx.accounts.user_lot_token_account.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            },
            &[&[
                b"contract",
                ctx.accounts.contract.admin.as_ref(),
                &[ctx.bumps.contract],
            ]],
        );
        mint_to(mint_to_ctx, order_quantity)?;

        // Calculate and transfer 10% of USDC to manager
        let price_in_cents = price
            .parse::<u64>()
            .map_err(|_| SeedlotContractsError::InvalidPrice)?;
        let price_in_usdc = price_in_cents * 10u64.pow(4);
        let total_price = price_in_usdc * order_quantity * ctx.accounts.contract.min_trees_per_lot;
        let manager_fee = total_price / 10; // 10% of the total price

        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program_standard.to_account_info(),
            Transfer {
                from: ctx.accounts.contract_usdc_token_account.to_account_info(),
                to: ctx.accounts.manager_usdc_token_account.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            },
        );
        transfer(transfer_ctx, manager_fee)?;

        // Add the new lot to the lots account
        ctx.accounts.lots_account.load_mut()?.push(Lot {
            mint: ctx.accounts.lot_mint.key(),
            manager: ctx.accounts.manager.key(),
            state: LotState::Preparation,
        })?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PrepareLot<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(
        mut,
        seeds = [b"contract", contract.admin.key().as_ref()],
        bump,
        has_one = offers_account,
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
    )]
    pub user_order_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub lot_mint: Signer<'info>,
    #[account(
        init,
        payer = user,
        associated_token::mint = lot_mint,
        associated_token::authority = user,
    )]
    pub user_lot_token_account: InterfaceAccount<'info, TokenAccount>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = contract,
    )]
    pub contract_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = manager,
    )]
    pub manager_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub token_program_standard: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

*/

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum LotState {
    Preparation,
    Growing,
    Ready,
    Shipped,
}

#[zero_copy]
pub struct LotMint {
    pub key: Pubkey,
}

const _TOTAL_LOTS: usize = 10_000;

#[account(zero_copy)]
#[repr(C)]
pub struct Lots {
    pub owner: Pubkey,
    pub tail: u64,
    pub lots: [LotMint; _TOTAL_LOTS],
}

impl Lots {
    pub const TOTAL_LOTS: u64 = _TOTAL_LOTS as u64;
    pub const LEN: usize = 8 // Discriminator
    + 32 // owner
    + 8 // tail
    + (32 * Self::TOTAL_LOTS as usize);

    pub fn push(&mut self, lot_mint: LotMint) -> Result<()> {
        require_neq!(self.tail, Self::TOTAL_LOTS, SeedlotContractsError::LotsFull);
        self.lots[self.tail as usize] = lot_mint;
        self.tail += 1;
        Ok(())
    }
}
