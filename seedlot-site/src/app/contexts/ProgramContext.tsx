"use client";
import React, {
  createContext,
  useContext,
  PropsWithChildren,
  FC,
  useMemo,
  useCallback,
  useState,
} from "react";
import {
  Program,
  AnchorProvider,
  setProvider,
  IdlTypes,
  IdlAccounts,
  web3,
  BN,
} from "@coral-xyz/anchor";
import idl from "../../../../seedlot-contracts/target/idl/seedlot_contracts.json";
import { SeedlotContracts } from "../../../../seedlot-contracts/target/types/seedlot_contracts";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { tree } from "next/dist/build/templates/app-page";

export type Contract = IdlAccounts<SeedlotContracts>["contract"];
export type CertificationTier = IdlTypes<SeedlotContracts>["certificationTier"];
export type MintMetadata = IdlTypes<SeedlotContracts>["mintMetadata"];
export const TREES_PER_LOT = new BN(100);
const CERTIFICATION_MINT_METADATA: MintMetadata = {
  name: "Seedlot Manager Certification",
  symbol: "SEEDLOT-MCERT",
  uri: "https://app.seedlot.io/certification",
  locationVarietyPrice: null,
  managerForLot: null,
};

const ProgramContext = createContext<{
  program?: Program<SeedlotContracts>;
  contract?: Contract;
  contractAddress?: PublicKey;
  useInitialize?: (usdcMint?: PublicKey) => Promise<Contract>;
  useLoadContract?: (contractAddress: PublicKey) => Promise<Contract>;
}>({
  program: undefined,
  contract: undefined,
  contractAddress: undefined,
  useInitialize: undefined,
  useLoadContract: undefined,
});

export const useProgramContext = () => useContext(ProgramContext);

export const ProgramProvider: FC<PropsWithChildren> = ({ children }) => {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();

  const [_contractAddress, setContractAddress] = useState<
    PublicKey | undefined
  >(undefined);
  const [_contract, setContract] = useState<Contract | undefined>(undefined);

  const provider = useMemo(() => {
    if (!anchorWallet) return;
    const connection = new Connection("https://api.devnet.solana.com");
    const p = new AnchorProvider(connection, anchorWallet);
    setProvider(p);
    return p;
  }, [anchorWallet]);

  const program = useMemo(() => {
    if (!provider) return;
    return new Program(
      idl as SeedlotContracts,
      provider
    ) as Program<SeedlotContracts>;
  }, [provider]);

  const initialize = useCallback(
    // If no usdcMint is provided, the program will create a new mint, meant for development.
    // It will set the admin as the usdcMint's authority.
    // For production, please use the actual USDC mint:
    // https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    async (usdcMint?: PublicKey) => {
      // TODO(jbrown8181): Admin guard this if you want
      if (!program) throw new Error("Program not initialized");
      if (!wallet) throw new Error("Wallet not found");
      if (!wallet.publicKey) throw new Error("Wallet not connected");
      const initializeZeroAccountInstruction = async (space: number) => {
        const newAccount = Keypair.generate();
        const lamportsForRentExemption =
          await program.provider.connection.getMinimumBalanceForRentExemption(
            space
          );
        const createAccountInstruction = SystemProgram.createAccount({
          fromPubkey: wallet.publicKey!,
          newAccountPubkey: newAccount.publicKey,
          lamports: lamportsForRentExemption,
          space,
          programId: program.programId,
        });
        return { newAccount, createAccountInstruction };
      };

      const [
        {
          newAccount: offersAccount,
          createAccountInstruction: createOffersAccountInstruction,
        },
        {
          newAccount: lotsAccount,
          createAccountInstruction: createLotsAccountInstruction,
        },
      ] = await Promise.all([
        initializeZeroAccountInstruction(program.account.offers.size),
        initializeZeroAccountInstruction(program.account.lots.size),
      ]);


      


      const _usdcMintKeyPair = Keypair.generate();
      const _usdcMint = usdcMint ?? _usdcMintKeyPair.publicKey;
      const createUSDCMintInstruction: TransactionInstruction[] | [] = usdcMint
        ? []
        : await (async () => {
            console.log("are you alive? ", wallet.publicKey);

            const createAccountInstruction = SystemProgram.createAccount({
              fromPubkey: anchorWallet!.publicKey,
              newAccountPubkey: _usdcMint,
              space: MINT_SIZE,
              lamports: await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE),
              programId: TOKEN_PROGRAM_ID,
            });

            const mint = createInitializeMintInstruction(
              _usdcMint,
              6,
              wallet.publicKey!,
              wallet.publicKey!,
              TOKEN_PROGRAM_ID
            );
            return [createAccountInstruction, mint];
          })();

          console.log("TOKEN_PROGRAM_ID: ", TOKEN_PROGRAM_ID.toBase58());
          console.log("MINT_SIZE: ", MINT_SIZE);

      const [contractPK] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("contract"), wallet.publicKey.toBuffer()],
        program.programId
      );
      // setContractAddress(contractPK);
      // const contractUsdcTokenAccount = getAssociatedTokenAddressSync(
      //   _usdcMint,
      //   contractPK,
      //   true,
      //   TOKEN_PROGRAM_ID,
      //   ASSOCIATED_TOKEN_PROGRAM_ID
      // );

      // const certificationMint = Keypair.generate();

      // /**
      //  * Accounts object containing various public keys and program IDs used in the application.
      //  *
      //  * @property {PublicKey} admin - The public key of the admin's wallet.
      //  * @property {PublicKey} contract - The public key of the contract.
      //  * @property {PublicKey} offersAccount - The public key of the offers account.
      //  * @property {PublicKey} lotsAccount - The public key of the lots account.
      //  * @property {PublicKey} systemProgram - The program ID of the system program.
      //  * @property {PublicKey} tokenProgram - The program ID of the token program (2022).
      //  * @property {PublicKey} certificationMint - The public key of the certification mint.
      //  * @property {PublicKey} usdcMint - The public key of the USDC mint.
      //  * @property {PublicKey} contractUsdcTokenAccount - The public key of the contract's USDC token account.
      //  * @property {PublicKey} associatedTokenProgram - The program ID of the associated token program.
      //  * @property {PublicKey} tokenProgramStandard - The program ID of the standard token program.
      //  */
      // const accounts = {
      //   admin: wallet.publicKey!,
      //   contract: contractPK,
      //   offersAccount: offersAccount.publicKey,
      //   lotsAccount: lotsAccount.publicKey,
      //   systemProgram: web3.SystemProgram.programId,
      //   tokenProgram: TOKEN_2022_PROGRAM_ID,
      //   certificationMint: certificationMint.publicKey,
      //   usdcMint: _usdcMint,
      //   contractUsdcTokenAccount: contractUsdcTokenAccount,
      //   associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      //   tokenProgramStandard: TOKEN_PROGRAM_ID,
      // };


      // console.log("accounts: ", accounts);
      // console.log("_usdcMint", _usdcMint);

   


      // const initializeInstruction = await program.methods.initialize(TREES_PER_LOT, CERTIFICATION_MINT_METADATA).accounts(accounts).instruction();

      // const message = new web3.TransactionMessage({
      //   payerKey: wallet.publicKey!,
      //   recentBlockhash: (await program.provider.connection.getLatestBlockhash()).blockhash,
      //   instructions: [
      //     createOffersAccountInstruction,
      //     createLotsAccountInstruction,
      //     ...createUSDCMintInstruction,
      //     initializeInstruction
      //   ],
      // }).compileToV0Message();

      // const tx = new VersionedTransaction(message);
      
      // console.log("Cert Mint", certificationMint.publicKey.toBase58());
      // console.log("Anchor wallet", anchorWallet?.publicKey.toBase58());
      // console.log("Usdc key", _usdcMintKeyPair.publicKey.toBase58());
      // console.log("Offers Account", offersAccount.publicKey.toBase58());
      // console.log("Lots Account", lotsAccount.publicKey.toBase58());

      // const walletSignedTx = await anchorWallet?.signTransaction(tx);
      // walletSignedTx?.sign([_usdcMintKeyPair, offersAccount, lotsAccount, certificationMint]);

      // if(!walletSignedTx) throw new Error("walletSignedTx is undefined");

      // console.log("walletSignedTx", walletSignedTx.message.staticAccountKeys.map((k) => k.toBase58()));

      // const confirmedTx = await program.provider.sendAndConfirm!(walletSignedTx).catch(async (err) => {
      //   if(err instanceof SendTransactionError) console.error(await err.getLogs(program.provider.connection));
      //   console.error(err);
      //   throw new Error("Transaction failed");
      // });

      // console.log("are we here?");
      console.log("contractPK", contractPK.toBase58());

      return loadContract(contractPK);


 





      

 

      // const sendPrepareAccountsTxPromise = await anchorWallet?.signTransaction(
      //   tx
      //   // program.provider.connection
      // );
      // console.log({sendPrepareAccountsTxPromise})
      // console.log(sendPrepareAccountsTxPromise?.signatures.map((s) => s.publicKey.toBase58()));

      // if (!sendPrepareAccountsTxPromise)
      //   throw new Error("sendPrepareAccountsTxPromise is undefined");


      // const [initializeTx] = await Promise.all([
      //   initializeTxPromise,
      //   confirmTx(
      //     await sendPrepareAccountsTxPromise,
      //     program.provider.connection
      //   ),
      // ]);

      // const txHash = await wallet.sendTransaction(
      //   initializeTx,
      //   program.provider.connection
      // );
      // await confirmTx(txHash, program.provider.connection);
      // return loadContract(contractPK);
    },
    [program, wallet, anchorWallet]
  );

  const loadContract = useCallback(
    async (contractAddress: PublicKey) => {
      if (!program) throw new Error("Program not initialized");
      if (contractAddress != _contractAddress) {
        setContractAddress(contractAddress);
      }
      const contract = await program.account.contract.fetch(contractAddress);
      setContract(contract);
      return contract;
    },
    [program, _contractAddress]
  );

  return (
    <ProgramContext.Provider
      value={{
        program,
        contract: _contract,
        contractAddress: _contractAddress,
        useInitialize: initialize,
        useLoadContract: loadContract,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

export const confirmTx = async (
  txHash: string,
  connection: web3.Connection
) => {
  const latestBlockHash = await connection.getLatestBlockhash();

  return connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txHash,
  });
};
