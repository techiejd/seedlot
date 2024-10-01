use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, InitializeMint, Token2022};
use anchor_spl::token_interface::Mint;

declare_id!("iFDyfQUC16yjtNZ1jAPaYfVWdzsqhsHC8ekiE2sJbX4");

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
        contract.certification_nft_mint = ctx.accounts.new_certification_nft_mint.key();

        // Initialize the certification NFT mint
        let cpi_accounts = InitializeMint {
            mint: ctx.accounts.new_certification_nft_mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token_2022::initialize_mint(cpi_ctx, 0, &contract.key(), None)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 8 + 32, // 8 bytes for discriminator + 32 bytes for pubkey + 8 bytes for u64 + 8 bytes for u64 + 32 bytes for pubkey
        seeds = [admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = contract,
        constraint = new_certification_nft_mint.to_account_info().key() == certification_nft_mint_as_signer.to_account_info().key()
    )]
    pub new_certification_nft_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub certification_nft_mint_as_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Contract {
    pub admin: Pubkey,
    pub min_trees_per_lot: u64,
    pub lot_price: u64,
    pub certification_nft_mint: Pubkey,
}
