use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::Token,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::{Contract, Lots};

#[derive(Accounts)]
pub struct PayHarvest<'info> {
    #[account(
      seeds = [b"contract", contract.admin.as_ref()],
      bump,
      has_one = admin,
      has_one = lots_account,
      has_one = usdc_mint,
  )]
    pub contract: Box<Account<'info, Contract>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
    #[account(mut)]
    pub manager: SystemAccount<'info>,
    #[account(mut)]
    pub admin: SystemAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(mut)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub token_program_standard: Program<'info, Token>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program_standard
    )]
    pub payer_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program_standard
    )]
    pub user_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = manager,
        associated_token::token_program = token_program_standard
    )]
    pub manager_usdc_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = admin,
        associated_token::token_program = token_program_standard
    )]
    pub admin_usdc_account: InterfaceAccount<'info, TokenAccount>,
    pub lots_account: AccountLoader<'info, Lots>,
    pub lot_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    #[account(
        mut,
        associated_token::mint = lot_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program
    )]
    pub user_lot_token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

pub mod instructions {
    use anchor_spl::token::{transfer_checked, Transfer, TransferChecked};

    use super::*;
    use crate::{
        utils::{get_token_metadata, get_value, price_cents_2_usdc},
        SeedlotContractsError,
    };

    pub fn pay_harvest(
        ctx: Context<PayHarvest>,
        lot_index: u64,
        manager_payment_for_harvest: u64,
        profit: u64,
    ) -> Result<()> {
        let lot = ctx.accounts.lots_account.load()?.get(lot_index)?;
        require_eq!(
            lot.mint.key(),
            ctx.accounts.lot_mint.key(),
            SeedlotContractsError::LotMintMismatch
        );
        // Get lot metadata
        let lot_token_metadata = get_token_metadata(&ctx.accounts.lot_mint)?;

        // Extract manager from lot metadata and compare to manager
        let manager = get_value(&lot_token_metadata, "manager")?;
        require_eq!(
            manager,
            ctx.accounts.manager.key().to_string(),
            SeedlotContractsError::ManagerMismatch
        );

        // Check the user_lot_token_account
        require_eq!(
            ctx.accounts.user_lot_token_account.amount,
            ctx.accounts.lot_mint.supply,
            SeedlotContractsError::UserMismatch
        );

        let profit_in_usdc = price_cents_2_usdc(&profit);
        let manager_payment_for_harvest_in_usdc = price_cents_2_usdc(&manager_payment_for_harvest);

        // Calculate payment splits
        let user_amount = profit_in_usdc / 2;
        let admin_amount = profit_in_usdc / 4;
        let manager_amount = profit_in_usdc / 4 + manager_payment_for_harvest_in_usdc;

        let payment_info = [
            (
                ctx.accounts.user_usdc_account.to_account_info(),
                user_amount,
            ),
            (
                ctx.accounts.admin_usdc_account.to_account_info(),
                admin_amount,
            ),
            (
                ctx.accounts.manager_usdc_account.to_account_info(),
                manager_amount,
            ),
        ];

        for (account, amount) in payment_info {
            transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program_standard.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.payer_usdc_account.to_account_info(),
                        to: account,
                        authority: ctx.accounts.payer.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                    },
                ),
                amount,
                6,
            )?;
        }
        Ok(())
    }
}
// Add these error codes to your error.rs file
#[error_code]
pub enum ErrorCode {
    #[msg("Lot not found in lots account")]
    LotNotFound,
    #[msg("Invalid manager for the lot")]
    InvalidManager,
}
