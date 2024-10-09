import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  useProgramContext,
  useSignSendAndConfirmIxs,
} from "../contexts/ProgramContext";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export type ConfirmLotsArgs = {
  confirmed: boolean;
  orderIndex: number;
  lotIndex: number;
  manager: PublicKey;
  user: PublicKey;
};

const useConfirmLots = () => {
  const { program, contractAddress, contract, lots, offers } =
    useProgramContext();
  const signSendAndConfirmIxs = useSignSendAndConfirmIxs();
  const wallet = useAnchorWallet();
  if (
    !program ||
    !signSendAndConfirmIxs ||
    !wallet ||
    !contract ||
    !lots ||
    !offers
  )
    return undefined;
  const confirmLots = async ({
    manager,
    user,
    confirmed,
    orderIndex,
    lotIndex,
  }: ConfirmLotsArgs) => {
    const confirmAccounts = {
      admin: wallet.publicKey,
      contract: contractAddress,
      manager: manager,
      certificationMint: contract.certificationMint,
      usdcMint: contract.usdcMint,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      lotsAccount: contract.lotsAccount,
      lotMint: lots.lots[lotIndex].mint,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      user,
      systemProgram: SystemProgram.programId,
      offersAccount: contract.offersAccount,
      orderMint: offers.offers[orderIndex].mint,
    };
    const ix = await program.methods
      .confirmLots(confirmed, new BN(orderIndex), new BN(lotIndex))
      .accounts(confirmAccounts)
      .instruction();
    return signSendAndConfirmIxs([ix]);
  };
  return confirmLots;
};

export default useConfirmLots;
