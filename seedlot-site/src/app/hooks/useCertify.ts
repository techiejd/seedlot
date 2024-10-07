import { useWallet } from "@solana/wallet-adapter-react";
import {
  CertificationTier,
  confirmTx,
  useProgramContext,
} from "../contexts/ProgramContext";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useManagerCertificationAta } from "./useAta";

export const useCertify = (manager: PublicKey) => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();
  const managerAta = useManagerCertificationAta(manager);

  const certify = async (tier: CertificationTier) => {
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
      .certify(tier)
      .accounts(accounts)
      .transaction();
    const txHash = await wallet.sendTransaction(
      tx,
      program.provider.connection
    );
    return await confirmTx(txHash, program.provider.connection);
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
    return await confirmTx(txHash, program.provider.connection);
  };

  return decertify;
};
