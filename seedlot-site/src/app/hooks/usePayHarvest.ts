import {
  useProgramContext,
  useSignSendAndConfirmIxs,
} from "@/app/contexts/ProgramContext";
import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey } from "@solana/web3.js";

export type PayHarvestArgs = {
  manager: PublicKey;
  user: PublicKey;
  admin: PublicKey;
  lotIndex: number;
  costOfHarvest: number; // in USD cents
  profit: number; // in USD cents
};

const usePayHarvest = () => {
  const { program, contractAddress, contract, lots } = useProgramContext();
  const signSendAndConfirmIxs = useSignSendAndConfirmIxs();
  const wallet = useAnchorWallet();
  if (!program || !signSendAndConfirmIxs || !wallet || !contract || !lots)
    return undefined;
  const payHarvest = async ({
    manager,
    user,
    admin,
    lotIndex,
    costOfHarvest,
    profit,
  }: PayHarvestArgs) => {
    const harvestAccounts = {
      contract: contractAddress,
      payer: wallet.publicKey,
      user,
      manager,
      admin,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      usdcMint: contract.usdcMint,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      lotsAccount: contract.lotsAccount,
      lotMint: lots.lots[lotIndex].mint,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    };
    const ix = await program.methods
      .payHarvest(new BN(lotIndex), new BN(costOfHarvest), new BN(profit))
      .accounts(harvestAccounts)
      .instruction();
    return signSendAndConfirmIxs([ix]);
  };
  return payHarvest;
};

export default usePayHarvest;
