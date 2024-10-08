import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  CertificationTier,
  useProgramContext,
  useSignSendAndConfirmIxs,
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
  const signSendAndConfirmIxs = useSignSendAndConfirmIxs();

  const certify = async (tier: CertificationTier) => {
    if (
      !program ||
      !contract ||
      !contractAddress ||
      !wallet?.publicKey ||
      !signSendAndConfirmIxs ||
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
    return signSendAndConfirmIxs([ix]);
  };

  return certify;
};

export const useDecertify = (manager: PublicKey) => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useAnchorWallet();
  const managerAta = useManagerCertificationAta(manager);
  const signSendAndConfirmIxs = useSignSendAndConfirmIxs();
  const decertify = async () => {
    if (
      !program ||
      !contract ||
      !contractAddress ||
      !wallet?.publicKey ||
      !signSendAndConfirmIxs
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
      .certify({ decertified: {} })
      .accounts(accounts)
      .instruction();
    return signSendAndConfirmIxs([ix]);
  };

  return decertify;
};
