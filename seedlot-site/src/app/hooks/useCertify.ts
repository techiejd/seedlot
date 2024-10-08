import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import {
  CertificationTier,
  confirmTx,
  useProgramContext,
  useVersionedTx,
} from "../contexts/ProgramContext";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useManagerCertificationAta } from "./useAta";

export const useCertify = (manager: PublicKey) => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useAnchorWallet();
  const managerAta = useManagerCertificationAta(manager);
  const getVersionedTx = useVersionedTx();

  const certify = async (tier: CertificationTier) => {
    if (
      !program ||
      !contract ||
      !contractAddress ||
      !wallet?.publicKey ||
      !getVersionedTx ||
      !program.provider.sendAndConfirm
    ) {
      throw new Error(
        `Program, contract, contract address, or wallet not set: ${JSON.stringify(
          { program, contract, contractAddress, wallet }
        )}`
      );
    }

    const accounts = {
      admin: wallet.publicKey,
      contract: contractAddress,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      manager: manager,
      certificationMint: contract.certificationMint,
    };
    const ix = await program.methods
      .certify(tier)
      .accounts(accounts)
      .instruction();
    const tx = await getVersionedTx([ix]);
    const signedTx = await wallet.signTransaction(tx);
    const confirmedTx = await program.provider.sendAndConfirm(signedTx);
    return confirmedTx;
  };

  return certify;
};

export const useDecertify = (manager: PublicKey) => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();
  const managerAta = useManagerCertificationAta(manager);

  const decertify = async () => {
    if (!program || !contract || !contractAddress || !wallet.publicKey) {
      throw new Error(
        `Program, contract, contract address, or wallet not set: ${JSON.stringify(
          { program, contract, contractAddress, wallet }
        )}`
      );
    }

    const accounts = {
      admin: wallet.publicKey,
      contract: contractAddress,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      manager: manager,
      certificationMint: contract.certificationMint,
    };
    const tx = await program.methods
      .certify({ decertified: {} })
      .accounts(accounts)
      .transaction();
    const txHash = await wallet.sendTransaction(
      tx,
      program.provider.connection
    );
    return txHash;
  };

  return decertify;
};
