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

export const useCertificationNumber = (manager: PublicKey) => {
  const managerAta = useManagerCertificationAta(manager);
  const { program, contract } = useProgramContext();
  const [certificationNumber, setCertificationNumber] = useState<
    number | undefined | "loading"
  >();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    console.log({ managerAta, program, contract });
    if (!managerAta || !program || !contract?.certificationMint || loading)
      return;
    setLoading(true);
    setCertificationNumber("loading");
    getAccount(
      program.provider.connection,
      managerAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    )
      .then((account) => {
        const tierNumber = account.amount;
        setCertificationNumber(Number(tierNumber));
      })
      .catch((error) => {
        console.error(error);
        setCertificationNumber(undefined);
      });
  }, [managerAta, program, contract?.certificationMint, contract, loading]);
  return certificationNumber;
};

export const useManagerCertificationTier = (manager: PublicKey) => {
  const certificationNumber = useCertificationNumber(manager);
  if (certificationNumber == "loading") {
    return "loading";
  }
  return certificationNumber
    ? convertToCertificationTier(Number(certificationNumber))
    : undefined;
};

enum ClientCertificationTierMirror {
  undefined = 0,
  tier1 = 1,
  tier2 = 2,
  tier3 = 3,
  tier4 = 4,
  decertified = 5,
}

const numberToClientCertificationTierMirror: { [key: number]: string } = {};
for (const key in ClientCertificationTierMirror) {
  if (typeof ClientCertificationTierMirror[key] === "number") {
    numberToClientCertificationTierMirror[ClientCertificationTierMirror[key]] =
      key;
  }
}

export const convertToCertificationTier = (tier: number) => {
  if (tier in numberToClientCertificationTierMirror) {
    return {
      [numberToClientCertificationTierMirror[tier]]: {},
    } as unknown as CertificationTier;
  }
  return undefined;
};
