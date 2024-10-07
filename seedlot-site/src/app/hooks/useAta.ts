import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useProgramContext } from "../contexts/ProgramContext";

export const useManagerCertificationAta = (manager?: PublicKey) => {
  const { contract } = useProgramContext();
  const managerAta =
    contract && manager
      ? getAssociatedTokenAddressSync(
          contract.certificationMint,
          manager,
          false,
          TOKEN_2022_PROGRAM_ID
        )
      : undefined;
  return managerAta;
};

export const getClientOrderAta = (client: PublicKey, orderMint: PublicKey) => {
  return getAssociatedTokenAddressSync(
    orderMint,
    client,
    false,
    TOKEN_2022_PROGRAM_ID
  );
};

export const getClientLotAta = (client: PublicKey, lotMint: PublicKey) => {
  return getAssociatedTokenAddressSync(
    lotMint,
    client,
    false,
    TOKEN_2022_PROGRAM_ID
  );
};

export const useUsdcAta = (owner?: PublicKey) => {
  const { contractAddress, contract } = useProgramContext();
  const usdcAta =
    contractAddress && contract && owner
      ? getAssociatedTokenAddressSync(
          contract.usdcMint,
          owner,
          owner == contractAddress,
          TOKEN_PROGRAM_ID
        )
      : undefined;
  return usdcAta;
};
