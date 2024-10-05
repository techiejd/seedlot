use anchor_lang::prelude::*;
use anchor_lang::system_program::create_account;
use anchor_spl::token_2022::{initialize_mint, InitializeMint as InitializeMintCpi, Token2022};
use anchor_spl::token_interface::spl_pod::optional_keys::OptionalNonZeroPubkey;
use anchor_spl::token_interface::{
    default_account_state_initialize, metadata_pointer_initialize, token_metadata_initialize,
    token_metadata_update_field, DefaultAccountStateInitialize, MetadataPointerInitialize,
    TokenMetadataInitialize, TokenMetadataUpdateField,
};
use spl_token_metadata_interface::state::{Field, TokenMetadata};

use anchor_lang::system_program::CreateAccount;
use spl_token_2022::{
    extension::ExtensionType,
    state::{AccountState, Mint as spl_Mint},
};

mod certify;
mod contract;
mod errors;
mod utils;

pub use certify::*;
pub use contract::*;
pub use errors::*;

declare_id!("AWMhFouhxyeqXrHCKXtJ6vNszopzBJ4RH7BA6rXUwCiV");

pub trait InitializeMint<'info> {
    fn init_mint(&self, mint: &Signer<'info>, mint_metadata: &MintMetadata) -> Result<()>;
}

impl<'info> InitializeMint<'info> for Context<'_, '_, '_, 'info, Initialize<'info>> {
    fn init_mint(&self, mint: &Signer<'info>, mint_metadata: &MintMetadata) -> Result<()> {
        let binded_admin_key = self.accounts.admin.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"contract",
            binded_admin_key.as_ref(),
            &[self.bumps.contract],
        ]];
        let extension_space = ExtensionType::try_calculate_account_len::<spl_Mint>(&[
            ExtensionType::DefaultAccountState,
            ExtensionType::MetadataPointer,
        ])?;

        let token_metadata_space;
        {
            let token_metadata = TokenMetadata {
                update_authority: OptionalNonZeroPubkey::try_from(Some(
                    self.accounts.contract.key(),
                ))?,
                mint: mint.key(),
                name: mint_metadata.name.to_string(),
                symbol: mint_metadata.symbol.to_string(),
                uri: mint_metadata.uri.to_string(),
                additional_metadata: mint_metadata
                    .location_variety
                    .clone()
                    .map(|location_variety| {
                        vec![
                            ("location".to_string(), location_variety[0].to_string()),
                            ("variety".to_string(), location_variety[1].to_string()),
                        ]
                    })
                    .unwrap_or_else(Vec::new),
            };

            token_metadata_space = token_metadata.tlv_size_of()?;
        }

        let space_buffer: usize = 8;
        let total_space = extension_space + token_metadata_space + space_buffer;

        create_account(
            CpiContext::new(
                self.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: self.accounts.admin.to_account_info(),
                    to: mint.to_account_info(),
                },
            ),
            self.accounts.rent.minimum_balance(total_space),
            extension_space as u64,
            &self.accounts.token_program.key(),
        )?;

        default_account_state_initialize(
            CpiContext::new(
                self.accounts.token_program.to_account_info(),
                DefaultAccountStateInitialize {
                    token_program_id: self.accounts.token_program.to_account_info(),
                    mint: mint.to_account_info(),
                },
            ),
            &AccountState::Frozen,
        )?;

        metadata_pointer_initialize(
            CpiContext::new(
                self.accounts.token_program.to_account_info(),
                MetadataPointerInitialize {
                    token_program_id: self.accounts.token_program.to_account_info(),
                    mint: mint.to_account_info(),
                },
            ),
            Some(self.accounts.contract.key()),
            Some(mint.key()),
        )?;

        initialize_mint(
            CpiContext::new(
                self.accounts.token_program.to_account_info(),
                InitializeMintCpi {
                    mint: mint.to_account_info(),
                    rent: self.accounts.rent.to_account_info(),
                },
            ),
            0,
            &self.accounts.contract.key(),
            Some(&self.accounts.contract.key()),
        )?;

        // Initialize metadata
        let cpi_accounts = TokenMetadataInitialize {
            token_program_id: self.accounts.token_program.to_account_info(),
            mint: mint.to_account_info(),
            metadata: mint.to_account_info(),
            mint_authority: self.accounts.contract.to_account_info(),
            update_authority: self.accounts.contract.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            self.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token_metadata_initialize(
            cpi_ctx,
            mint_metadata.name.to_string(),
            mint_metadata.symbol.to_string(),
            mint_metadata.uri.to_string(),
        )?;

        if let Some(ref location_variety) = mint_metadata.location_variety {
            for (i, val) in location_variety.iter().enumerate() {
                token_metadata_update_field(
                    CpiContext::new_with_signer(
                        self.accounts.token_program.to_account_info(),
                        TokenMetadataUpdateField {
                            token_program_id: self.accounts.token_program.to_account_info(),
                            metadata: mint.to_account_info(),
                            update_authority: self.accounts.contract.to_account_info(),
                        },
                        signer_seeds,
                    ),
                    Field::Key((["location", "variety"][i]).to_string()),
                    val.to_string(),
                )?;
            }
        }

        Ok(())
    }
}

#[program]
pub mod seedlot_contracts {
    use super::*;

    pub fn initialize<'info>(
        ctx: Context<'_, '_, '_, 'info, Initialize<'info>>,
        min_trees_per_lot: u64,
        lot_price: u64,
        certification_mint_metadata: MintMetadata,
    ) -> Result<()> {
        ctx.init_mint(
            &ctx.accounts.certification_mint,
            &certification_mint_metadata,
        )?;
        let contract = &mut ctx.accounts.contract;
        contract.admin = ctx.accounts.admin.key();
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
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

/*
#[derive(Accounts)]
pub struct AddOffer<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"contract", admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub order_mint: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

// TODO(techiejd): Get back to this.
#[account]
pub struct FulfilledOrderMints {
    pub owning_contract: Pubkey,
    pub mints: [Pubkey; 10_000],
}
 */

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MintMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub location_variety: Option<[String; 2]>,
}
