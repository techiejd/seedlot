use core::fmt;

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_program::program_option::COption;

declare_id!("Bj5esFf6t1g1nRRw2n12NDuad4fxFoXRavFnC1daX2Zk");

#[program]
pub mod seedlot_contracts {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        min_trees_per_lot: u64,
        lot_price: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;
        contract.admin = ctx.accounts.admin.key();
        contract.min_trees_per_lot = min_trees_per_lot;
        contract.lot_price = lot_price;
        contract.certification_mint = ctx.accounts.mint.key();

        Ok(())
    }

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
        require_eq!(
            current_certification + 1,
            new_tier_number,
            SeedlotContractsError::CertificationsMustIncreaseByOneTier
        );

        // Mint one token to the manager's token account
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
            1,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 8 + 32, // 8 bytes for discriminator + 32 bytes for pubkey + 8 bytes for u64 + 8 bytes for u64 + 32 bytes for pubkey
        seeds = [b"contract", admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(
        mint::decimals = 0,
        mint::authority = contract,
        constraint = mint.supply == 0,
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint_as_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

#[account]
pub struct Contract {
    pub admin: Pubkey,
    pub min_trees_per_lot: u64,
    pub lot_price: u64,
    pub certification_mint: Pubkey,
}

// Add this enum definition
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

#[error_code]
pub enum SeedlotContractsError {
    AdminCannotBeCertified,
    CertificationsMustIncreaseByOneTier,
    CannotCertifyAboveTierFour,
    NoCertificationTierZero,
}
