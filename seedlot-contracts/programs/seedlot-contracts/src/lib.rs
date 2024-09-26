use anchor_lang::prelude::*;

declare_id!("842Eo9smCu8upye7yjHDBYrk8FF8utZPgPDYpMaJZsxT");

#[program]
pub mod seedlot_contracts {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
