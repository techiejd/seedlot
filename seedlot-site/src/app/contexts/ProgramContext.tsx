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
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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
  const connection = new Connection("https://api.devnet.solana.com");
  const [_contractAddress, setContractAddress] = useState<
    PublicKey | undefined
  >(undefined);
  const [_contract, setContract] = useState<Contract | undefined>(undefined);

  const provider = useMemo(() => {
    if (!anchorWallet) return;
    const p = new AnchorProvider(connection, anchorWallet);
    setProvider(p);
    return p;
  }, [connection, anchorWallet]);

  const program = useMemo(() => {
    if (!provider) return;
    return new Program(idl as SeedlotContracts, provider) as Program<SeedlotContracts>;
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

      const _usdcMint = usdcMint ?? Keypair.generate().publicKey;
      const createUSDCMintInstruction: [TransactionInstruction] | [] = usdcMint
        ? []
        : (() => {
            const mint = createInitializeMintInstruction(
              _usdcMint,
              6,
              wallet.publicKey!,
              wallet.publicKey!
            );
            return [mint];
          })();

      const contractPK = Keypair.generate().publicKey;
      setContractAddress(contractPK);
      const contractUsdcTokenAccount = getAssociatedTokenAddressSync(
        _usdcMint,
        contractPK,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const certificationMint = Keypair.generate();

      const accounts = {
        admin: wallet.publicKey!,
        contract: contractPK,
        offersAccount: offersAccount.publicKey,
        lotsAccount: lotsAccount.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        certificationMint: certificationMint.publicKey,
        usdcMint: _usdcMint,
        contractUsdcTokenAccount: contractUsdcTokenAccount,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgramStandard: TOKEN_PROGRAM_ID,
      };

      const initializeTxPromise = program.methods
        .initialize(TREES_PER_LOT, CERTIFICATION_MINT_METADATA)
        .accounts(accounts)
        .signers([certificationMint])
        .transaction();

      const sendPrepareAccountsTxPromise = wallet.sendTransaction(
        new Transaction().add(
          createOffersAccountInstruction,
          createLotsAccountInstruction,
          ...createUSDCMintInstruction
        ),
        program.provider.connection
      );

      const [initializeTx] = await Promise.all([
        initializeTxPromise,
        confirmTx(
          await sendPrepareAccountsTxPromise,
          program.provider.connection
        ),
      ]);

      const txHash = await wallet.sendTransaction(
        initializeTx,
        program.provider.connection
      );
      await confirmTx(txHash, program.provider.connection);
      return loadContract(contractPK);
    },
    [program, wallet]
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
