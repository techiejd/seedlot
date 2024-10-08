use crate::{Contract, Offers, SeedlotContractsError};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount};
use solana_program::program_option::COption;

pub mod instructions {
    use crate::utils::{
        get_token_metadata, get_value, mint_frozen_tokens_to, price_cents_2_usdc,
        price_string_2_cents, MintFrozenTokensTo, MintFrozenTokensToBumps,
    };

    use super::*;
    use anchor_spl::token::{transfer, Transfer};

    pub fn place_order(
        ctx: Context<PlaceOrder>,
        offer_index: u64,
        order_quantity: u64,
    ) -> Result<()> {
        ctx.accounts
            .offers_account
            .load()?
            .verify_order(offer_index, ctx.accounts.offer_mint.key())?;

        let order_token_metadata = get_token_metadata(&ctx.accounts.offer_mint)?;
        // The price is stored in [2] of order_token_metadata.additional_metadata
        let price = get_value(&order_token_metadata, "price")?;
        let price_in_cents = price_string_2_cents(&price)?;
        let price_in_usdc = price_cents_2_usdc(&price_in_cents);
        let total_price = price_in_usdc * order_quantity * ctx.accounts.contract.trees_per_lot;

        // Now we need to transfer `price_in_usdc` USDC from the user to the contract
        let transfer_ctx = Transfer {
            from: ctx.accounts.usdc_from.to_account_info(),
            to: ctx.accounts.contract_usdc_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        transfer(
            CpiContext::new(
                ctx.accounts.token_program_standard.to_account_info(),
                transfer_ctx,
            ),
            total_price,
        )?;

        // Now we need to mint_to the offer_mint to the user
        mint_frozen_tokens_to(
            Context::new(
                ctx.program_id,
                &mut MintFrozenTokensTo {
                    authority: ctx.accounts.user.to_account_info(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.offer_mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    associated_token_program: ctx.accounts.associated_token_program.clone(),
                    token_program: ctx.accounts.token_program.clone(),
                },
                &[],
                MintFrozenTokensToBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            order_quantity,
        )?;

        Ok(())
    }
}

impl Offers {
    pub fn verify_order(&self, offer_index: u64, order_mint_key: Pubkey) -> Result<()> {
        require_gte!(
            self.tail,
            offer_index,
            SeedlotContractsError::InvalidOfferIndex
        );
        let offer = self.offers[offer_index as usize];
        require_eq!(
            offer.mint,
            order_mint_key,
            SeedlotContractsError::OrderMintNotFound
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
      mut,
      seeds = [b"contract", contract.admin.key().as_ref()],
      bump,
      has_one = offers_account,
      has_one = usdc_mint,
      constraint = contract.usdc_token_account.key() == contract_usdc_token_account.key(),
    )]
    pub contract: Account<'info, Contract>,
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut,
    constraint = offer_mint.mint_authority == COption::Some(contract.key()),
    )]
    pub offer_mint: InterfaceAccount<'info, Mint>,
    #[account(
      init_if_needed,
      payer = user,
      associated_token::mint = offer_mint,
      associated_token::authority = user,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(
      mut,
      associated_token::mint = usdc_mint,
      associated_token::authority = user,
    )]
    pub usdc_from: InterfaceAccount<'info, TokenAccount>,
    #[account(
      mut,
      associated_token::mint = usdc_mint,
      associated_token::authority = contract,
  )]
    pub contract_usdc_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program_standard: Program<'info, Token>,
}
