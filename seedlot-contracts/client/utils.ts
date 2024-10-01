import { web3 } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";

export const airdrop = async <T extends anchor.Idl>(
  addy: web3.PublicKey,
  program: anchor.Program<T>
) => {
  const airdropSignature = await program.provider.connection.requestAirdrop(
    addy,
    5 * web3.LAMPORTS_PER_SOL
  );
  return confirmTx(airdropSignature, program);
};

export const confirmTx = async <T extends anchor.Idl>(
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
