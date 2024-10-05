use anchor_lang::prelude::*;

use crate::Certify;

pub fn mint_certification_tokens(ctx: &Context<Certify>, amount: u64) -> Result<()> {
    // Thaw the account before minting
    anchor_spl::token_2022::thaw_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token_2022::ThawAccount {
            account: ctx.accounts.manager_to.to_account_info(),
            mint: ctx.accounts.certification_mint.to_account_info(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.admin.key().as_ref(),
            &[ctx.bumps.contract],
        ]],
    ))?;
    anchor_spl::token_2022::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token_2022::MintTo {
                mint: ctx.accounts.certification_mint.to_account_info(),
                to: ctx.accounts.manager_to.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            },
            &[&[
                b"contract",
                ctx.accounts.admin.key().as_ref(),
                &[ctx.bumps.contract],
            ]],
        ),
        amount,
    )?;
    // Freeze the account after minting
    anchor_spl::token_2022::freeze_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token_2022::FreezeAccount {
            account: ctx.accounts.manager_to.to_account_info(),
            mint: ctx.accounts.certification_mint.to_account_info(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.admin.key().as_ref(),
            &[ctx.bumps.contract],
        ]],
    ))?;
    Ok(())
}
