import { Program, web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { SeedlotContracts } from "../target/types/seedlot_contracts";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

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

export const CERTIFICATION_MINT_METADATA: MintMetadata = {
  name: "Seedlot Manager Certification",
  symbol: "SEEDLOT-MCERT",
  uri: "https://app.seedlot.io/certification",
  locationVariety: null,
};
export const MIN_TREES_PER_LOT = new anchor.BN(10);
export const LOT_PRICE = new anchor.BN(200);

export const initialize = async () => {
  const admin = web3.Keypair.generate();
  const certificationMint = web3.Keypair.generate();
  await airdrop(admin.publicKey);

  const [contractPK] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("contract"), admin.publicKey.toBuffer()],
    program.programId
  );

  const accounts = {
    admin: admin.publicKey,
    contract: contractPK,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    certificationMint: certificationMint.publicKey,
  };
  const txHash = await program.methods
    .initialize(MIN_TREES_PER_LOT, LOT_PRICE, CERTIFICATION_MINT_METADATA)
    .accounts(accounts)
    .signers([admin, certificationMint])
    .rpc();

  const txConfirmation = await confirmTx(txHash);
  return {
    txConfirmation,
    contractPK,
    certificationMint: certificationMint,
    admin,
  };
};
