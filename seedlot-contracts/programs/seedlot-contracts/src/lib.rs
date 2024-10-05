use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;

mod certify;
mod contract;
mod errors;
mod offers;
mod utils;

pub use certify::*;
pub use contract::*;
pub use errors::*;
pub use offers::*;
use utils::{init_mint, InitMint, InitMintBumps, MintMetadata};
declare_id!("C4o4QSNLw5mpdwyJGr5JXuC2ZnukLNbLF6S5zLtGeucK");

#[program]
pub mod seedlot_contracts {

    use super::*;

    pub fn initialize<'info>(
        ctx: Context<'_, '_, '_, 'info, Initialize<'info>>,
        min_trees_per_lot: u64,
        lot_price: u64,
        certification_mint_metadata: MintMetadata,
    ) -> Result<()> {
        init_mint(
            Context::new(
                ctx.program_id,
                &mut InitMint {
                    admin: ctx.accounts.admin.clone(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.certification_mint.clone(),
                    rent: ctx.accounts.rent.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[],
                InitMintBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            &certification_mint_metadata,
        )?;
        ctx.accounts.offers_account.load_init()?.owner = ctx.accounts.contract.key();
        let contract = &mut ctx.accounts.contract;
        contract.admin = ctx.accounts.admin.key();
        contract.offers_account = ctx.accounts.offers_account.key();
        contract.min_trees_per_lot = min_trees_per_lot;
        contract.lot_price = lot_price;
        contract.certification_mint = ctx.accounts.certification_mint.key();
        Ok(())
    }

    pub fn certify(ctx: Context<Certify>, new_tier: CertificationTier) -> Result<()> {
        certify::instructions::certify(ctx, new_tier)
    }

    pub fn decertify(ctx: Context<Certify>) -> Result<()> {
        certify::instructions::decertify(ctx)
    }

    pub fn add_offer(ctx: Context<AddOffer>, offer_mint_metadata: MintMetadata) -> Result<()> {
        offers::instructions::add_offer(ctx, &offer_mint_metadata)
    }

    #[constant]
    pub const TOTAL_OFFERS: u64 = Offers::TOTAL_OFFERS;
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = Contract::LEN,
        seeds = [b"contract", admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub certification_mint: Signer<'info>,
    #[account(zero)]
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}
