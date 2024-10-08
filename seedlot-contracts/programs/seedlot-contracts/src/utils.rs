use anchor_lang::prelude::*;
use anchor_lang::system_program::create_account;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{
    burn, freeze_account, initialize_mint, mint_to, thaw_account, Burn, FreezeAccount,
    InitializeMint as InitializeMintCpi, MintTo, ThawAccount, Token2022,
};
use anchor_spl::token_interface::spl_pod::optional_keys::OptionalNonZeroPubkey;
use anchor_spl::token_interface::{
    default_account_state_initialize, metadata_pointer_initialize, mint_close_authority_initialize,
    permanent_delegate_initialize, token_metadata_initialize, token_metadata_update_field,
    DefaultAccountStateInitialize, MetadataPointerInitialize, Mint, MintCloseAuthorityInitialize,
    PermanentDelegateInitialize, TokenAccount, TokenMetadataInitialize, TokenMetadataUpdateField,
};
use solana_program::program_option::COption;
use spl_token_2022::extension::{BaseStateWithExtensions, PodStateWithExtensions};
use spl_token_2022::pod::PodMint;
use spl_token_metadata_interface::state::{Field, TokenMetadata};

use anchor_lang::system_program::CreateAccount;
use spl_token_2022::{
    extension::ExtensionType,
    state::{AccountState, Mint as spl_Mint},
};

use crate::{Contract, SeedlotContractsError};

pub fn get_token_metadata(mint: &InterfaceAccount<Mint>) -> Result<TokenMetadata> {
    let account_info = &mint.to_account_info();
    let buffer = &account_info.data.borrow();
    let mint = PodStateWithExtensions::<PodMint>::unpack(&buffer)?;
    mint.get_variable_len_extension::<TokenMetadata>()
        .map_err(|e| anchor_lang::error::Error::from(e))
}

pub fn get_value(metadata: &TokenMetadata, key: &str) -> Result<String> {
    metadata
        .additional_metadata
        .iter()
        .find(|&x| x.0 == key)
        .map(|x| x.1.clone())
        .ok_or_else(|| error!(SeedlotContractsError::AdditionalMetadataIllFormed))
}

pub fn price_string_2_cents(price: &String) -> Result<u64> {
    // Price is stored as a "100" = 1 USD
    let p = price
        .parse::<u64>()
        .map_err(|_| SeedlotContractsError::InvalidPrice)?;
    Ok(p)
}

pub fn price_cents_2_usdc(price: &u64) -> u64 {
    // USDC has 6 decimals, so we need to convert the price to the correct number of decimal places
    price * 10u64.pow(4)
}

#[derive(Accounts)]
pub struct InitMint<'info> {
    pub payer: Signer<'info>,
    #[account(
        seeds = [b"contract", contract.admin.as_ref()],
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
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"contract",
        ctx.accounts.contract.admin.as_ref(),
        &[ctx.bumps.contract],
    ]];
    let extension_space = ExtensionType::try_calculate_account_len::<spl_Mint>(&[
        ExtensionType::DefaultAccountState,
        ExtensionType::MetadataPointer,
        ExtensionType::PermanentDelegate,
        ExtensionType::MintCloseAuthority,
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
                    if let Some(ref manager_for_lot) = mint_metadata.manager_for_lot {
                        vec![
                            (
                                "location".to_string(),
                                location_variety_price[0].to_string(),
                            ),
                            ("variety".to_string(), location_variety_price[1].to_string()),
                            ("manager".to_string(), manager_for_lot.to_string()),
                            ("state".to_string(), "0".to_string()),
                        ]
                    } else {
                        vec![
                            (
                                "location".to_string(),
                                location_variety_price[0].to_string(),
                            ),
                            ("variety".to_string(), location_variety_price[1].to_string()),
                            ("price".to_string(), location_variety_price[2].to_string()),
                        ]
                    }
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
                from: ctx.accounts.payer.to_account_info(),
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

    permanent_delegate_initialize(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            PermanentDelegateInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        &ctx.accounts.contract.key(),
    )?;

    mint_close_authority_initialize(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintCloseAuthorityInitialize {
                token_program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
            signer_seeds,
        ),
        Some(&ctx.accounts.contract.key()),
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
        // TODO(techiejd): This is mad awkward. But it is a hackathon.
        // We expect the possibility to be a manager pubkey only if location_variety_price is set.
        let additional_metadata: Vec<(String, String)>;
        if let Some(ref manager_for_lot) = mint_metadata.manager_for_lot {
            additional_metadata = vec![
                ("location".to_string(), location_variety_price[0].clone()),
                ("variety".to_string(), location_variety_price[1].clone()),
                ("manager".to_string(), manager_for_lot.clone()),
                ("state".to_string(), "0".to_string()),
            ];
        } else {
            additional_metadata = vec![
                ("location".to_string(), location_variety_price[0].clone()),
                ("variety".to_string(), location_variety_price[1].clone()),
                ("price".to_string(), location_variety_price[2].clone()),
            ];
        }

        for val in additional_metadata.iter() {
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
                Field::Key(val.0.clone()),
                val.1.clone(),
            )?;
        }
    }

    Ok(())
}

pub fn burn_frozen_tokens_from(ctx: Context<BurnFrozenTokensFrom>, amount: u64) -> Result<()> {
    // Thaw the account before burning
    thaw_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        ThawAccount {
            account: ctx.accounts.from.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.contract.admin.as_ref(),
            &[ctx.bumps.contract],
        ]],
    ))?;
    burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                from: ctx.accounts.from.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.contract.to_account_info(),
            },
            &[&[
                b"contract",
                ctx.accounts.contract.admin.as_ref(),
                &[ctx.bumps.contract],
            ]],
        ),
        amount,
    )?;
    // Freeze the account after burning
    freeze_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        FreezeAccount {
            account: ctx.accounts.from.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.contract.admin.as_ref(),
            &[ctx.bumps.contract],
        ]],
    ))?;
    Ok(())
}

pub fn mint_frozen_tokens_to(ctx: Context<MintFrozenTokensTo>, amount: u64) -> Result<()> {
    // Thaw the account before minting
    thaw_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        ThawAccount {
            account: ctx.accounts.to.clone(),
            mint: ctx.accounts.mint.clone(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.contract.admin.as_ref(),
            &[ctx.bumps.contract],
        ]],
    ))?;
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.clone(),
                to: ctx.accounts.to.clone(),
                authority: ctx.accounts.contract.to_account_info(),
            },
            &[&[
                b"contract",
                ctx.accounts.contract.admin.as_ref(),
                &[ctx.bumps.contract],
            ]],
        ),
        amount,
    )?;
    // Freeze the account after minting
    freeze_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        FreezeAccount {
            account: ctx.accounts.to.clone(),
            mint: ctx.accounts.mint.clone(),
            authority: ctx.accounts.contract.to_account_info(),
        },
        &[&[
            b"contract",
            ctx.accounts.contract.admin.as_ref(),
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
    pub manager_for_lot: Option<String>,
}

#[derive(Accounts)]
pub struct MintFrozenTokensTo<'info> {
    /// CHECK: Only used for getting the associated token address.
    pub authority: AccountInfo<'info>,
    #[account(mut,
        seeds = [b"contract", contract.admin.as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    /// CHECK: One should be able to live dangerously. Anyways, this is an internal context; please be sure it's a mint and the authority is contract.
    pub mint: AccountInfo<'info>,
    /// CHECK: Internal context. Make sure to corresponds to the mint.
    pub to: AccountInfo<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct BurnFrozenTokensFrom<'info> {
    /// CHECK: Only used for getting the associated token address.
    pub authority: AccountInfo<'info>,
    #[account(
        seeds = [b"contract", contract.admin.as_ref()],
        bump
    )]
    pub contract: Account<'info, Contract>,
    #[account(
        mut,
        constraint = mint.mint_authority == COption::Some(contract.key())
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority
    )]
    pub from: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
}
