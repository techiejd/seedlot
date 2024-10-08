use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};

use crate::Lots;

use crate::{Contract, Offers, SeedlotContractsError};

pub mod instructions {
    use crate::certify::instructions::decertify;
    use crate::utils::{
        burn_frozen_tokens_from, mint_frozen_tokens_to, price_cents_2_usdc, BurnFrozenTokensFrom,
        BurnFrozenTokensFromBumps, MintFrozenTokensTo, MintFrozenTokensToBumps,
    };
    use crate::{CertificationTier, Certify, CertifyBumps};

    use super::*;
    use anchor_spl::token::{transfer, Transfer};
    use anchor_spl::token_2022::{close_account, thaw_account, CloseAccount, ThawAccount};
    use anchor_spl::token_interface::{token_metadata_update_field, TokenMetadataUpdateField};
    use spl_token_metadata_interface::state::Field;

    pub fn confirm_lots(
        ctx: Context<ConfirmLots>,
        confirmed: bool,
        offer_index: u64,
        lot_index: u64,
    ) -> Result<()> {
        let lot = ctx.accounts.lots_account.load()?.get(lot_index)?;
        require_eq!(
            lot.mint.key(),
            ctx.accounts.lot_mint.key(),
            SeedlotContractsError::LotMintMismatch
        );
        ctx.accounts
            .offers_account
            .load()?
            .verify_order(offer_index, ctx.accounts.order_mint.key())?;
        let prepared_lots = ctx.accounts.lot_mint.supply;
        let price_in_usdc = price_cents_2_usdc(&lot.original_price_per_tree);
        let total_price = price_in_usdc * ctx.accounts.contract.trees_per_lot * prepared_lots;

        if confirmed {
            let remaining_fee = total_price * 9 / 10; // 90% of the total price. TODO(tech): make this configurable
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
                remaining_fee,
            )?;

            // Now we update the lot's metadata
            token_metadata_update_field(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TokenMetadataUpdateField {
                        token_program_id: ctx.accounts.token_program.to_account_info(),
                        metadata: ctx.accounts.lot_mint.to_account_info(),
                        update_authority: ctx.accounts.contract.to_account_info(),
                    },
                    &[&[
                        b"contract",
                        ctx.accounts.contract.admin.as_ref(),
                        &[ctx.bumps.contract],
                    ]],
                ),
                Field::Key("state".to_string()),
                "1".to_string(),
            )?;

            thaw_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                ThawAccount {
                    account: ctx.accounts.user_lot_token_account.to_account_info(),
                    mint: ctx.accounts.lot_mint.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                },
                &[&[
                    b"contract",
                    ctx.accounts.contract.admin.as_ref(),
                    &[ctx.bumps.contract],
                ]],
            ))?;
        } else {
            // Decertify the manager
            let decertified_tier_as_u64 = CertificationTier::Decertified as u64;
            require_neq!(
                ctx.accounts.manager_certification_token_account.amount,
                decertified_tier_as_u64,
                SeedlotContractsError::ManagerAlreadyDecertified
            );
            let current_number_of_certification_tokens =
                ctx.accounts.manager_certification_token_account.amount;
            let number_of_tokens_needed_to_decertify =
                decertified_tier_as_u64 - current_number_of_certification_tokens;

            mint_frozen_tokens_to(
                Context::new(
                    ctx.program_id,
                    &mut MintFrozenTokensTo {
                        authority: ctx.accounts.manager.to_account_info(),
                        contract: *ctx.accounts.contract.clone(),
                        mint: ctx.accounts.certification_mint.to_account_info(),
                        to: ctx
                            .accounts
                            .manager_certification_token_account
                            .to_account_info(),
                        associated_token_program: ctx.accounts.associated_token_program.clone(),
                        token_program: ctx.accounts.token_program.clone(),
                    },
                    &[],
                    MintFrozenTokensToBumps {
                        contract: ctx.bumps.contract,
                    },
                ),
                number_of_tokens_needed_to_decertify,
            )?;

            // Return 10% to the contract's USDC account
            let return_manager_fee = total_price / 10; // 10% of the total price
            transfer(
                CpiContext::new(
                    ctx.accounts.token_program_standard.to_account_info(),
                    Transfer {
                        from: ctx.accounts.admin_usdc_token_account.to_account_info(),
                        to: ctx.accounts.contract_usdc_token_account.to_account_info(),
                        authority: ctx.accounts.admin.to_account_info(),
                    },
                ),
                return_manager_fee,
            )?;

            // Re-mint order tokens
            mint_frozen_tokens_to(
                Context::new(
                    ctx.program_id,
                    &mut MintFrozenTokensTo {
                        authority: ctx.accounts.user.clone(),
                        contract: *ctx.accounts.contract.clone(),
                        mint: ctx.accounts.order_mint.to_account_info(),
                        to: ctx.accounts.user_order_token_account.to_account_info(),
                        associated_token_program: ctx.accounts.associated_token_program.clone(),
                        token_program: ctx.accounts.token_program.clone(),
                    },
                    &[],
                    MintFrozenTokensToBumps {
                        contract: ctx.bumps.contract,
                    },
                ),
                prepared_lots,
            )?;

            // Burn lot tokens
            burn_frozen_tokens_from(
                Context::new(
                    ctx.program_id,
                    &mut BurnFrozenTokensFrom {
                        authority: ctx.accounts.user.clone(),
                        contract: *ctx.accounts.contract.clone(),
                        mint: ctx.accounts.lot_mint.clone(),
                        from: ctx.accounts.user_lot_token_account.clone(),
                        associated_token_program: ctx.accounts.associated_token_program.clone(),
                        token_program: ctx.accounts.token_program.clone(),
                    },
                    &[],
                    BurnFrozenTokensFromBumps {
                        contract: ctx.bumps.contract,
                    },
                ),
                prepared_lots,
            )?;

            // Close lot mint
            close_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.lot_mint.to_account_info(),
                    destination: ctx.accounts.contract.to_account_info(),
                    authority: ctx.accounts.contract.to_account_info(),
                },
                &[&[
                    b"contract",
                    ctx.accounts.contract.admin.as_ref(),
                    &[ctx.bumps.contract],
                ]],
            ))?;

            // Remove the lot from the lots account
            ctx.accounts.lots_account.load_mut()?.remove(lot_index)?;
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ConfirmLots<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = admin,
        associated_token::token_program = token_program_standard,
    )]
    pub admin_usdc_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        seeds = [b"contract", contract.admin.as_ref()],
        bump,
        has_one = admin,
        has_one = offers_account,
        has_one = lots_account,
        has_one = usdc_mint,
        has_one = certification_mint,
    )]
    pub contract: Box<Account<'info, Contract>>,
    /// CHECK: This account is used for getting the associated token addresses only.
    pub manager: SystemAccount<'info>,
    #[account(mut,
        mint::authority = contract,
        mint::token_program = token_program,
        mint::freeze_authority = contract,
    )]
    pub certification_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = certification_mint,
        associated_token::authority = manager,
        associated_token::token_program = token_program,
    )]
    pub manager_certification_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = contract,
        associated_token::token_program = token_program_standard,
    )]
    pub contract_usdc_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = manager,
        associated_token::token_program = token_program_standard,
    )]
    pub manager_usdc_token_account: Box<InterfaceAccount<'info, TokenAccount>>,
    pub token_program_standard: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(mut)]
    pub lots_account: AccountLoader<'info, Lots>,
    #[account(mut,
        mint::authority = contract,
        mint::token_program = token_program,
    )]
    pub lot_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    /// CHECK: This account is used for getting the associated token addresses only.
    pub user: AccountInfo<'info>,
    #[account(
        mut,
        associated_token::mint = lot_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_lot_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut,
        mint::authority = contract,
        mint::token_program = token_program,
    )]
    pub order_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = order_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_order_token_account: InterfaceAccount<'info, TokenAccount>,
}
