use anchor_lang::prelude::*;

#[error_code]
pub enum SeedlotContractsError {
    AdminCannotBeCertified,
    CertificationsMustIncreaseByOneTier,
    CannotCertifyAboveTierFour,
    NoCertificationTierZero,
    ManagerAlreadyDecertified,
    OffersFull,
}
