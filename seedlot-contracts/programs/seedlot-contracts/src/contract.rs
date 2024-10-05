use anchor_lang::prelude::*;

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const U64_LENGTH: usize = 8;

impl Contract {
    pub const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // admin
        + U64_LENGTH // min_trees_per_lot
        + U64_LENGTH // lot_price
        + PUBLIC_KEY_LENGTH; // certification_mint
}

#[account]
pub struct Contract {
    pub admin: Pubkey,
    pub min_trees_per_lot: u64,
    pub lot_price: u64,
    pub certification_mint: Pubkey,
}
