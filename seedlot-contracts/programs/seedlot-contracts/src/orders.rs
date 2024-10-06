use anchor_lang::prelude::*;
use anchor_spl::token_2022::{Token2022, Mint, MintTo, TokenAccount};
use crate::{Contract, Offers, SeedlotContractsError};

pub fn place_order(ctx: Context<PlaceOrder>, offer_index: u64, order_quantity: u64) -> Result<()> {
    let offers = &mut ctx.accounts.offers_account.load()?;
    require!(
        offer_index < offers.tail,
        SeedlotContractsError::InvalidOfferIndex
    );

    let offer = offers.offers[offer_index as usize];
    let seeds = &[
        b"contract",
        &ctx.accounts.contract.admin.to_bytes(),
        &[ctx.bumps.contract],
    ];
    let signer = &[&seeds[..]];

    anchor_spl::token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.offer_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            },
            signer,
        ),
        order_quantity,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    pub user: Signer<'info>,
    #[account(
        seeds = [b"contract", contract.admin.key().as_ref()],
        bump,
        has_one = offers_account,
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut)]
    pub offer_mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = offer_mint,
        token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}
