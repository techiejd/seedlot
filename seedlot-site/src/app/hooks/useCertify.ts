import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  CertificationTier,
  useProgramContext,
  useSignSendAndConfirmIxs,
} from "../contexts/ProgramContext";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useManagerCertificationAta } from "./useAta";
import { useEffect, useState } from "react";

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
        `Program, contract, contract address, or wallet not set: ${{
          program,
          contract,
          contractAddress,
          wallet,
        }}`
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

export const useManagerCertificationTier = (manager: PublicKey) => {
  const managerAta = useManagerCertificationAta(manager);
  const { program, contract } = useProgramContext();
  const [certificationTier, setCertificationTier] = useState<
    CertificationTier | undefined
  >();
  useEffect(() => {
    if (!managerAta || !program || !contract?.certificationMint) return;
    getAccount(
      program.provider.connection as unknown as Connection,
      managerAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    )
      .then((account) => {
        const tierNumber = account.amount;
        setCertificationTier(
          (() => {
            switch (tierNumber) {
              case 0n:
                return { undefined: {} };
              case 1n:
                return { tier1: {} };
              case 2n:
                return { tier2: {} };
              case 3n:
                return { tier3: {} };
              case 4n:
                return { tier4: {} };
              case 5n:
                return { decertified: {} };
              default:
                return undefined;
            }
          })()
        );
      })
      .catch((error) => {
        console.error(error);
        return undefined;
      });
  }, [managerAta, program, contract?.certificationMint]);
  return certificationTier;
};
