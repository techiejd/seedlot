import { Program, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { SeedlotContracts } from "../target/types/seedlot_contracts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const _airdrop = async <T extends anchor.Idl>(
  addy: web3.PublicKey,
  program: anchor.Program<T>
) => {
  const airdropSignature = await program.provider.connection.requestAirdrop(
    addy,
    5 * web3.LAMPORTS_PER_SOL
  );
  return _confirmTx(airdropSignature, program);
};

const _confirmTx = async <T extends anchor.Idl>(
  txHash: string,
  program: anchor.Program<T>
) => {
  const latestBlockHash =
    await program.provider.connection.getLatestBlockhash();

  return program.provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txHash,
  });
};

anchor.setProvider(anchor.AnchorProvider.env());
export type Contract = anchor.IdlAccounts<SeedlotContracts>["contract"];
export type CertificationTier =
  anchor.IdlTypes<SeedlotContracts>["certificationTier"];
export type MintMetadata = anchor.IdlTypes<SeedlotContracts>["mintMetadata"];
export const program = anchor.workspace
  .SeedlotContracts as Program<SeedlotContracts>;
export const confirmTx = (txHash: string) => _confirmTx(txHash, program);
export const airdrop = (addy: web3.PublicKey) => _airdrop(addy, program);

export const TOTAL_OFFERS = Number(
  program.idl.constants.find((c) => c.name === "totalOffers")?.value
);

export const TOTAL_LOTS = Number(
  program.idl.constants.find((c) => c.name === "totalLots")?.value
);

export const CERTIFICATION_MINT_METADATA: MintMetadata = {
  name: "Seedlot Manager Certification",
  symbol: "SEEDLOT-MCERT",
  uri: "https://app.seedlot.io/certification",
  locationVarietyPrice: null,
};
export const TREES_PER_LOT = new anchor.BN(10);
export const PRICE_PER_TREE = "1500";

export const initializeZeroAccount = async (
  admin: web3.Keypair,
  space: number
) => {
  const newAccount = web3.Keypair.generate();
  const lamportsForRentExemption =
    await program.provider.connection.getMinimumBalanceForRentExemption(space);
  const createAccountInstruction = web3.SystemProgram.createAccount({
    fromPubkey: admin.publicKey,
    newAccountPubkey: newAccount.publicKey,
    lamports: lamportsForRentExemption,
    space,
    programId: program.programId,
  });
  const transaction = new web3.Transaction().add(createAccountInstruction);
  await web3.sendAndConfirmTransaction(
    program.provider.connection,
    transaction,
    [admin, newAccount]
  );
  return newAccount;
};

export const initializeUSDC = async () => {
  const authority = web3.Keypair.generate();
  await airdrop(authority.publicKey);
  const mint = await createMint(
    program.provider.connection,
    authority,
    authority.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  return { mint, authority };
};

export const initialize = async () => {
  const admin = web3.Keypair.generate();
  const certificationMint = web3.Keypair.generate();
  await airdrop(admin.publicKey);

  const [contractPK] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("contract"), admin.publicKey.toBuffer()],
    program.programId
  );

  const [offersAccount, usdc] = await Promise.all([
    initializeZeroAccount(admin, program.account.offers.size),
    initializeUSDC(),
  ]);

  const contractUsdcTokenAccount = getAssociatedTokenAddressSync(
    usdc.mint,
    contractPK,
    true
  );

  const accounts = {
    admin: admin.publicKey,
    contract: contractPK,
    offersAccount: offersAccount.publicKey,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    certificationMint: certificationMint.publicKey,
    usdcMint: usdc.mint,
    contractUsdcTokenAccount: contractUsdcTokenAccount,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenProgramStandard: TOKEN_PROGRAM_ID,
  };
  const txHash = await program.methods
    .initialize(TREES_PER_LOT, CERTIFICATION_MINT_METADATA)
    .accounts(accounts)
    .signers([admin, certificationMint])
    .rpc();

  const txConfirmation = await confirmTx(txHash);
  return {
    txConfirmation,
    contractPK,
    certificationMint,
    admin,
    offersAccount,
    contractUsdcTokenAccount,
    usdc,
  };
};
