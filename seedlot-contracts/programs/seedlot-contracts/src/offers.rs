use anchor_lang::prelude::*;

use anchor_spl::token_2022::Token2022;

use crate::{Contract, SeedlotContractsError};

pub mod instructions {
    use crate::utils::{init_mint, InitMint, InitMintBumps, MintMetadata};

    use super::*;
    pub fn add_offer(ctx: Context<AddOffer>, offer_mint_metadata: &MintMetadata) -> Result<()> {
        init_mint(
            Context::new(
                ctx.program_id,
                &mut InitMint {
                    payer: ctx.accounts.admin.clone(),
                    contract: ctx.accounts.contract.clone(),
                    mint: ctx.accounts.order_mint.clone(),
                    rent: ctx.accounts.rent.clone(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[],
                InitMintBumps {
                    contract: ctx.bumps.contract,
                },
            ),
            offer_mint_metadata,
        )?;
        let offers = &mut ctx.accounts.offers_account;
        offers.load_mut()?.push(Offer {
            mint: ctx.accounts.order_mint.key(),
        })?;
        Ok(())
    }
}

impl Offers {
    pub fn push(&mut self, offer: Offer) -> Result<()> {
        require_neq!(
            self.tail,
            Self::TOTAL_OFFERS,
            SeedlotContractsError::OffersFull
        );
        self.offers[self.tail as usize] = offer;
        self.tail += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AddOffer<'info> {
    #[account(mut, constraint = admin.key() == contract.admin)]
    pub admin: Signer<'info>,
    #[account(
      seeds = [b"contract", admin.key().as_ref()],
      bump,
      constraint = contract.offers_account == offers_account.key()
    )]
    pub contract: Account<'info, Contract>,
    #[account(mut)]
    pub offers_account: AccountLoader<'info, Offers>,
    #[account(mut)]
    pub order_mint: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}
/*
// TODO(techiejd): Get back to this.
#[account]
pub struct FulfilledOrderMints {
    pub owning_contract: Pubkey,
    pub mints: [Pubkey; 10_000],
}
 */

impl Offers {
    pub const TOTAL_OFFERS: u64 = 300;
    pub const LEN: usize = 8 // Discriminator
    + 32 // owner Pubkey
    + 32 // tail u64
    + (Self::TOTAL_OFFERS as usize * 32);
}

#[zero_copy]
pub struct Offer {
    pub mint: Pubkey,
}

#[account(zero_copy)]
#[repr(C)]
pub struct Offers {
    pub owner: Pubkey,
    pub tail: u64,
    pub offers: [Offer; 300],
}
