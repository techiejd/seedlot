use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_token_metadata::state::Metadata;

#[derive(Accounts)]
pub struct PayHarvest<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub user: SystemAccount<'info>,
    #[account(mut)]
    pub admin: SystemAccount<'info>,
    #[account(mut)]
    pub manager: SystemAccount<'info>,

    #[account(mut)]
    pub lots_account: Account<'info, LotsAccount>,

    pub lot_mint: Account<'info, Mint>,
    /// CHECK: We're reading the metadata account
    #[account(
        seeds = ["metadata".as_bytes(), token_metadata_program.key().as_ref(), lot_mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key()
    )]
    pub lot_mint_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = payer
    )]
    pub payer_usdc_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = user
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = admin
    )]
    pub admin_usdc_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = manager
    )]
    pub manager_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn pay_harvest(ctx: Context<PayHarvest>, lot_id: u64, amount: u64) -> Result<()> {
    // Check if the lot exists in lots_account
    let lot = ctx
        .accounts
        .lots_account
        .lots
        .iter()
        .find(|&lot| lot.id == lot_id)
        .ok_or(ErrorCode::LotNotFound)?;

    // Verify the manager from lot mint metadata
    let metadata = Metadata::from_account_info(&ctx.accounts.lot_mint_metadata)?;
    let manager_key = metadata.update_authority;
    require!(
        manager_key == ctx.accounts.manager.key(),
        ErrorCode::InvalidManager
    );

    // Calculate payment splits
    let user_amount = amount / 2;
    let admin_amount = amount / 4;
    let manager_amount = amount / 4;

    // Transfer USDC from payer to user
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.payer_usdc_account.to_account_info(),
                to: ctx.accounts.user_usdc_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        user_amount,
    )?;

    // Transfer USDC from payer to admin
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.payer_usdc_account.to_account_info(),
                to: ctx.accounts.admin_usdc_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        admin_amount,
    )?;

    // Transfer USDC from payer to manager
    anchor_spl::token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.payer_usdc_account.to_account_info(),
                to: ctx.accounts.manager_usdc_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        manager_amount,
    )?;

    // Update lot status or perform any other necessary operations
    // ...

    Ok(())
}

// Add these error codes to your error.rs file
#[error_code]
pub enum ErrorCode {
    #[msg("Lot not found in lots account")]
    LotNotFound,
    #[msg("Invalid manager for the lot")]
    InvalidManager,
}
