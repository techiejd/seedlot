use anchor_lang::prelude::*;

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const U64_LENGTH: usize = 8;

impl Contract {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // admin
        + U64_LENGTH // trees_per_lot
        + PUBLIC_KEY_LENGTH // certification_mint
        + PUBLIC_KEY_LENGTH // offers_account
        + PUBLIC_KEY_LENGTH // usdc_mint
        + PUBLIC_KEY_LENGTH // usdc_token_account
        + PUBLIC_KEY_LENGTH; // lots_account
}

#[account]
pub struct Contract {
    pub admin: Pubkey,
    pub trees_per_lot: u64,
    pub certification_mint: Pubkey,
    // TODO(techiejd): Change to group https://solana.com/developers/courses/token-extensions/group-member
    pub offers_account: Pubkey,
    pub usdc_mint: Pubkey,
    pub usdc_token_account: Pubkey,
    // TODO(techiejd): Change to group https://solana.com/developers/courses/token-extensions/group-member
    pub lots_account: Pubkey,
}
