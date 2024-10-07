use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};

mod certify;
mod contract;
mod errors;
mod lots;
mod offers;
mod orders;
mod utils;

pub use certify::*;
pub use contract::*;
pub use errors::*;
pub use lots::*;
pub use offers::*;
pub use orders::*;
use utils::{init_mint, InitMint, InitMintBumps, MintMetadata};

declare_id!("2oBmZcNPKhqV6T3tu2ytnp2cBYhjf6aedu5R9L14Vsyj");

#[program]
pub mod seedlot_contracts {

    use super::*;

    pub fn initialize<'info>(
        ctx: Context<'_, '_, '_, 'info, Initialize<'info>>,
        trees_per_lot: u64,
        certification_mint_metadata: MintMetadata,
    ) -> Result<()> {
        ctx.accounts.contract.admin = ctx.accounts.admin.key(); // must be done before initializing the mint because it relies on context.admin
        init_mint(
            Context::new(
                ctx.program_id,
                &mut InitMint {
                    payer: ctx.accounts.admin.clone(),
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
        ctx.accounts.lots_account.load_init()?.owner = ctx.accounts.contract.key();
        let contract = &mut ctx.accounts.contract;
        contract.admin = ctx.accounts.admin.key();
        contract.offers_account = ctx.accounts.offers_account.key();
        contract.lots_account = ctx.accounts.lots_account.key();
        contract.trees_per_lot = trees_per_lot;
        contract.certification_mint = ctx.accounts.certification_mint.key();
        contract.usdc_token_account = ctx.accounts.contract_usdc_token_account.key();
        contract.usdc_mint = ctx.accounts.usdc_mint.key();
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

    pub fn place_order(
        ctx: Context<PlaceOrder>,
        offer_index: u64,
        order_quantity: u64,
    ) -> Result<()> {
        orders::instructions::place_order(ctx, offer_index, order_quantity)
    }

    pub fn prepare_lots(
        ctx: Context<PrepareLots>,
        order_index: u64,
        order_quantity: u64,
        manager_for_lot: String,
    ) -> Result<()> {
        lots::instructions::prepare_lots(ctx, order_index, order_quantity, manager_for_lot)
    }
    #[constant]
    pub const TOTAL_OFFERS: u64 = Offers::TOTAL_OFFERS;

    #[constant]
    pub const TOTAL_LOTS: u64 = Lots::TOTAL_LOTS;
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
    #[account(zero)]
    pub lots_account: AccountLoader<'info, Lots>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        associated_token::mint = usdc_mint,
        associated_token::authority = contract,
        associated_token::token_program = token_program_standard
    )]
    pub contract_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program_standard: Program<'info, Token>,
}
