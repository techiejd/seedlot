import { useWallet } from "@solana/wallet-adapter-react";
import {
  confirmTx,
  MintMetadata,
  useProgramContext,
} from "../contexts/ProgramContext";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export type Offer = {
  location: string;
  variety: string;
  price: number; // Should be in USD but cents. So $1 = 100.
};

const useAddOffer = () => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();

  const addOffer = async (offer: Offer) => {
    if (!program || !contract || !contractAddress || !wallet.publicKey) {
      throw new Error(
        `Program, contract, contract address, or wallet not set: ${JSON.stringify(
          { program, contract, contractAddress, wallet }
        )}`
      );
    }

    const orderMintMetadata: MintMetadata = {
      name: `Seedlot Offer: ${offer.location} - ${offer.variety}`,
      symbol: `SO-${offer.location}-${offer.variety}`,
      uri: `https://app.seedlot.io/offers/${offer.location}-${offer.variety}`,
      locationVarietyPrice: [
        offer.location,
        offer.variety,
        offer.price.toString(),
      ],
    };

    const orderMint = Keypair.generate();
    const accounts = {
      admin: wallet.publicKey,
      contract: contractAddress,
      offersAccount: contract.offersAccount,
      orderMint: orderMint.publicKey,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    const tx = await program.methods
      .addOffer(orderMintMetadata)
      .accounts(accounts)
      .signers([orderMint])
      .transaction();
    const txHash = await wallet.sendTransaction(
      tx,
      program.provider.connection
    );
    return await confirmTx(txHash, program.provider.connection);
  };

  return addOffer;
};

export default useAddOffer;
