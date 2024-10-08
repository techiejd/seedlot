import { useWallet } from "@solana/wallet-adapter-react";
import { confirmTx, useProgramContext } from "../contexts/ProgramContext";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

export type PrepareLotsParams = {
  orderMintIndex: number;
  numLotsToPrepare: number;
  orderMint: PublicKey;
  user: PublicKey;
};

const usePrepareLots = () => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();

  const prepareLots = async (params: PrepareLotsParams) => {
    if (!program || !contract || !contractAddress || !wallet.publicKey) {
      throw new Error(
        `Program, contract, contract address, or wallet not set: ${JSON.stringify(
          { program, contract, contractAddress, wallet }
        )}`
      );
    }

    const userOrderTokenAccount = getAssociatedTokenAddressSync(
      params.orderMint,
      params.user,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const lotMint = Keypair.generate();
    const userLotTokenAccount = getAssociatedTokenAddressSync(
      lotMint.publicKey,
      params.user,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const prepareLotsAccounts = {
      user: params.user,
      manager: wallet.publicKey,
      contract: contractAddress,
      offersAccount: contract.offersAccount,
      lotsAccount: contract.lotsAccount,
      orderMint: params.orderMint,
      userOrderTokenAccount: userOrderTokenAccount,
      lotMint: lotMint.publicKey,
      userLotTokenAccount,
      usdcMint: contract.usdcMint,
      certificationMint: contract.certificationMint,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    };

    const tx = await program.methods
      .prepareLots(
        new BN(params.orderMintIndex),
        new BN(params.numLotsToPrepare),
        wallet.publicKey.toBase58()
      )
      .accounts(prepareLotsAccounts)
      .signers([lotMint])
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000,
        }),
      ])
      .transaction();

    const txHash = await wallet.sendTransaction(
      tx,
      program.provider.connection
    );
    return await confirmTx(txHash, program.provider.connection);
  };

  return prepareLots;
};

export default usePrepareLots;
