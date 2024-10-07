import { useWallet } from "@solana/wallet-adapter-react";
import { confirmTx, useProgramContext } from "../contexts/ProgramContext";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getClientOrderAta, useUsdcAta } from "./useAta";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export type Order = {
  mintIndexInOffers: number;
  mint: PublicKey;
  amount: number;
};

const usePlaceOrder = () => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();
  const userUsdcAta = useUsdcAta(
    wallet.publicKey == null ? undefined : wallet.publicKey
  );

  const placeOrder = async (order: Order) => {
    if (!program || !contract || !contractAddress || !wallet.publicKey) {
      throw new Error(
        `Program, contract, contract address, or wallet not set: ${JSON.stringify(
          { program, contract, contractAddress, wallet }
        )}`
      );
    }
    const numOrders = 5;
    const userTokenAccount = getClientOrderAta(wallet.publicKey, order.mint);
    const accounts = {
      user: wallet.publicKey,
      contract: contractAddress,
      offersAccount: contract.offersAccount,
      offerMint: order.mint,
      userTokenAccount: userTokenAccount,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      usdcMint: contract.usdcMint,
      usdcFrom: userUsdcAta,
      contractUsdcTokenAccount: contract.usdcTokenAccount,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
    };

    const tx = await program.methods
      .placeOrder(new BN(order.mintIndexInOffers), new BN(order.amount))
      .accounts(accounts)
      .transaction();

    return await confirmTx(
      await wallet.sendTransaction(tx, program.provider.connection),
      program.provider.connection
    );
  };
};

export default usePlaceOrder;
