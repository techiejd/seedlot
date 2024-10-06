use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use core::fmt;
use solana_program::program_option::COption;

use crate::{Contract, SeedlotContractsError};
pub mod instructions {
    use crate::utils::{mint_frozen_tokens_to, MintFrozenTokensTo, MintFrozenTokensToBumps};

    use super::*;

    pub fn certify(ctx: Context<Certify>, new_tier: CertificationTier) -> Result<()> {
        require_neq!(
            new_tier,
            CertificationTier::Undefined,
            SeedlotContractsError::NoCertificationTierZero
        );
        require_neq!(
            new_tier,
            CertificationTier::Decertified,
            SeedlotContractsError::CannotCertifyAboveTierFour
        );
        let new_tier_number = new_tier as u64;
        let current_certification = ctx.accounts.manager_to.amount;
        require_neq!(
            current_certification,
            CertificationTier::Decertified as u64,
            SeedlotContractsError::ManagerAlreadyDecertified
        );
        require_eq!(
            current_certification + 1,
            new_tier_number,
            SeedlotContractsError::CertificationsMustIncreaseByOneTier
        );

        // Mint one token to the manager's token account to show they are certified or increase their tier
        mint_frozen_tokens_to(
            Context::new(
                ctx.program_id,
                &mut MintFrozenTokensTo {
                    authority: ctx.accounts.manager.to_account_info(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.certification_mint.clone(),
                    to: ctx.accounts.manager_to.clone(),
                    associated_token_program: ctx.accounts.associated_token_program.clone(),
                    token_program: ctx.accounts.token_program.clone(),
                },
                &[],
                MintFrozenTokensToBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            1,
        )?;

        Ok(())
    }

    pub fn decertify(ctx: Context<Certify>) -> Result<()> {
        let decertified_tier_as_u64 = CertificationTier::Decertified as u64;
        require_neq!(
            ctx.accounts.manager_to.amount,
            decertified_tier_as_u64,
            SeedlotContractsError::ManagerAlreadyDecertified
        );
        let current_number_of_certification_tokens = ctx.accounts.manager_to.amount;
        let number_of_tokens_needed_to_decertify =
            decertified_tier_as_u64 - current_number_of_certification_tokens;

        mint_frozen_tokens_to(
            Context::new(
                ctx.program_id,
                &mut MintFrozenTokensTo {
                    authority: ctx.accounts.manager.to_account_info(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.certification_mint.clone(),
                    to: ctx.accounts.manager_to.clone(),
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
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
#[repr(u8)]
pub enum CertificationTier {
    Undefined = 0,
    Tier1 = 1,       // Can get up to 10 lots
    Tier2 = 2,       // Can get up to 1,000 lots
    Tier3 = 3,       // Can get up to 10,000 lots
    Tier4 = 4,       // No limit
    Decertified = 5, // Can no longer be used for certification
}

impl fmt::Display for CertificationTier {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Accounts)]
pub struct Certify<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        constraint = admin.key() != manager.key() @ SeedlotContractsError::AdminCannotBeCertified
    )]
    pub manager: SystemAccount<'info>,
    #[account(
        seeds = [b"contract", admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(
        mut,
        constraint = certification_mint.mint_authority == COption::Some(contract.key())
    )]
    pub certification_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = certification_mint,
        associated_token::authority = manager,
    )]
    pub manager_to: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}
