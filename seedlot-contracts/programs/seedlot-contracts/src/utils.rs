use anchor_lang::prelude::*;
use anchor_lang::system_program::create_account;
use anchor_spl::token_2022::{initialize_mint, InitializeMint as InitializeMintCpi};
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

use crate::{Certify, Contract};

#[derive(Accounts)]
pub struct InitMint<'info> {
    pub admin: Signer<'info>,
    #[account(
        seeds = [b"contract", admin.key().as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    pub mint: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: Read-only
    pub token_program: AccountInfo<'info>,
    /// CHECK: Read-only
    pub system_program: AccountInfo<'info>,
}

pub fn init_mint<'info>(
    ctx: Context<'_, '_, '_, 'info, InitMint<'info>>,
    mint_metadata: &MintMetadata,
) -> Result<()> {
    let binded_admin_key = ctx.accounts.admin.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"contract",
        binded_admin_key.as_ref(),
        &[ctx.bumps.contract],
    ]];
    let extension_space = ExtensionType::try_calculate_account_len::<spl_Mint>(&[
        ExtensionType::DefaultAccountState,
        ExtensionType::MetadataPointer,
    ])?;

    let token_metadata_space;
    {
        let token_metadata = TokenMetadata {
            update_authority: OptionalNonZeroPubkey::try_from(Some(ctx.accounts.contract.key()))?,
            mint: ctx.accounts.mint.key(),
            name: mint_metadata.name.to_string(),
            symbol: mint_metadata.symbol.to_string(),
            uri: mint_metadata.uri.to_string(),
            additional_metadata: mint_metadata
                .location_variety_price
                .clone()
                .map(|location_variety_price| {
                    vec![
                        (
                            "location".to_string(),
                            location_variety_price[0].to_string(),
                        ),
                        ("variety".to_string(), location_variety_price[1].to_string()),
                        ("price".to_string(), location_variety_price[2].to_string()),
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
            ctx.accounts.system_program.to_account_info(),
            CreateAccount {
                from: ctx.accounts.admin.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        ctx.accounts.rent.minimum_balance(total_space),
        extension_space as u64,
        &ctx.accounts.token_program.key(),
    )?;

    default_account_state_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            DefaultAccountStateInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        &AccountState::Frozen,
    )?;

    metadata_pointer_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MetadataPointerInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        Some(ctx.accounts.contract.key()),
        Some(ctx.accounts.mint.key()),
    )?;

    initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeMintCpi {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        0,
        &ctx.accounts.contract.key(),
        Some(&ctx.accounts.contract.key()),
    )?;

    // Initialize metadata
    let cpi_accounts = TokenMetadataInitialize {
        token_program_id: ctx.accounts.token_program.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        metadata: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.contract.to_account_info(),
        update_authority: ctx.accounts.contract.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token_metadata_initialize(
        cpi_ctx,
        mint_metadata.name.to_string(),
        mint_metadata.symbol.to_string(),
        mint_metadata.uri.to_string(),
    )?;

    if let Some(ref location_variety_price) = mint_metadata.location_variety_price {
        for (i, val) in location_variety_price.iter().enumerate() {
            token_metadata_update_field(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TokenMetadataUpdateField {
                        token_program_id: ctx.accounts.token_program.to_account_info(),
                        metadata: ctx.accounts.mint.to_account_info(),
                        update_authority: ctx.accounts.contract.to_account_info(),
                    },
                    signer_seeds,
                ),
                Field::Key((["location", "variety", "price"][i]).to_string()),
                val.to_string(),
            )?;
        }
    }

    Ok(())
}

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MintMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub location_variety_price: Option<[String; 3]>,
}
