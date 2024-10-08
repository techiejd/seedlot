"use client";
import React, {
  createContext,
  useContext,
  PropsWithChildren,
  FC,
  useMemo,
  useCallback,
  useState,
  useEffect,
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
  TransactionInstruction,
  VersionedTransaction,
  Signer,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export type Contract = IdlAccounts<SeedlotContracts>["contract"];
export type CertificationTier = IdlTypes<SeedlotContracts>["certificationTier"];
export type MintMetadata = IdlTypes<SeedlotContracts>["mintMetadata"];
export type Lots = IdlTypes<SeedlotContracts>["lots"];
export type Lot = IdlTypes<SeedlotContracts>["lot"];
export type Offers = IdlTypes<SeedlotContracts>["offers"];
export type Offer = IdlTypes<SeedlotContracts>["offer"];
export const TREES_PER_LOT = new BN(100);
const CERTIFICATION_MINT_METADATA: MintMetadata = {
  name: "Seedlot Manager Certification",
  symbol: "SEEDLOT-MCERT",
  uri: "https://app.seedlot.io/certification",
  locationVarietyPrice: null,
  managerForLot: null,
};

export const useSignSendAndConfirmIxs = () => {
  const anchorWallet = useAnchorWallet();
  const { program } = useProgramContext();
  if (!anchorWallet || !program || !program.provider.sendAndConfirm)
    return undefined;

  const signSendAndConfirmIxs = async (
    instructions: TransactionInstruction[],
    signers: Signer[] = []
  ) => {
    const message = new web3.TransactionMessage({
      payerKey: anchorWallet.publicKey!,
      recentBlockhash: (await program.provider.connection.getLatestBlockhash())
        .blockhash,
      instructions,
    }).compileToV0Message();

    const tx = new VersionedTransaction(message).sign(signers);
    const walletSignedTx = await anchorWallet.signTransaction(tx);
    return await program.provider.sendAndConfirm!(walletSignedTx);
  };

  return signSendAndConfirmIxs;
};

const ProgramContext = createContext<{
  program?: Program<SeedlotContracts>;
  contract?: Contract;
  contractAddress?: PublicKey;
  lots?: Lots;
  offers?: Offers;
  useInitialize?: (usdcMint?: PublicKey) => Promise<Contract>;
  useLoadContract?: (contractAddress: PublicKey) => Promise<Contract>;
}>({
  program: undefined,
  contract: undefined,
  contractAddress: undefined,
  useInitialize: undefined,
  useLoadContract: undefined,
  lots: undefined,
  offers: undefined,
});

export const useProgramContext = () => useContext(ProgramContext);

export const ProgramProvider: FC<
  PropsWithChildren<{ contractPK: string | undefined }>
> = ({ children, contractPK }) => {
  const anchorWallet = useAnchorWallet();
  const [_contractAddress, setContractAddress] = useState<
    PublicKey | undefined
  >(contractPK ? new PublicKey(contractPK) : undefined);
  const [_contract, setContract] = useState<Contract | undefined>(undefined);
  const [lots, setLots] = useState<Lots | undefined>(undefined);
  const [offers, setOffers] = useState<Offers | undefined>(undefined);

  const [provider, setProvider] = useState<AnchorProvider | undefined>(
    undefined
  );

  useEffect(() => {
    // TODO: FIGURE OUT WHY THIS ANCHOR WALLET IS NOT LOADING
    console.log("Anchor Wallet", anchorWallet);
    if (!anchorWallet) return;
    const connection = new Connection("https://api.devnet.solana.com");
    const p = new AnchorProvider(connection, anchorWallet);
    setProvider(p);
  }, [anchorWallet]);

  const program = useMemo(() => {
    if (!provider) return;
    return new Program(
      idl as SeedlotContracts,
      provider
    ) as Program<SeedlotContracts>;
  }, [provider]);

  const signSendAndConfirmIxs = useSignSendAndConfirmIxs();

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

  useEffect(() => {
    // TODO: FIGURE OUT WHY THE LOAD CONTRACT IS NOT WORKING
    console.log(provider, program, contractPK);
    if (!provider) return;
    if (!program) return;
    if (!contractPK) return;
    console.log("Loading contract", contractPK);
    console.log("PublicKey contract", new PublicKey(contractPK));
    loadContract(new PublicKey(contractPK));
  }, [contractPK, loadContract, program, provider]);

  const initialize = useCallback(
    // If no usdcMint is provided, the program will create a new mint, meant for development.
    // It will set the admin as the usdcMint's authority.
    // For production, please use the actual USDC mint:
    // https://solscan.io/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    async (usdcMint?: PublicKey) => {
      // TODO(jbrown8181): Admin guard this if you want
      if (!program) throw new Error("Program not initialized");
      if (!anchorWallet) throw new Error("Wallet not found");
      if (!anchorWallet.publicKey) throw new Error("Wallet not connected");
      if (!signSendAndConfirmIxs) throw new Error("VersionedTx not found");
      const initializeZeroAccountInstruction = async (space: number) => {
        const newAccount = Keypair.generate();
        const lamportsForRentExemption =
          await program.provider.connection.getMinimumBalanceForRentExemption(
            space
          );
        const createAccountInstruction = SystemProgram.createAccount({
          fromPubkey: anchorWallet.publicKey!,
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
            const createAccountInstruction = SystemProgram.createAccount({
              fromPubkey: anchorWallet!.publicKey,
              newAccountPubkey: _usdcMint,
              space: MINT_SIZE,
              lamports:
                await program.provider.connection.getMinimumBalanceForRentExemption(
                  MINT_SIZE
                ),
              programId: TOKEN_PROGRAM_ID,
            });

            const mint = createInitializeMintInstruction(
              _usdcMint,
              6,
              anchorWallet.publicKey!,
              anchorWallet.publicKey!,
              TOKEN_PROGRAM_ID
            );
            return [createAccountInstruction, mint];
          })();

      const [contractPK] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("contract"), anchorWallet.publicKey.toBuffer()],
        program.programId
      );
      setContractAddress(contractPK);
      const contractUsdcTokenAccount = getAssociatedTokenAddressSync(
        _usdcMint,
        contractPK,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const certificationMint = Keypair.generate();

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
      const accounts = {
        admin: anchorWallet.publicKey!,
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

      const initializeInstruction = await program.methods
        .initialize(TREES_PER_LOT, CERTIFICATION_MINT_METADATA)
        .accounts(accounts)
        .instruction();

      console.log("Cert Mint", certificationMint.publicKey.toBase58());
      console.log("Anchor wallet", anchorWallet?.publicKey.toBase58());
      console.log("Usdc key", _usdcMintKeyPair.publicKey.toBase58());
      console.log("Offers Account", offersAccount.publicKey.toBase58());
      console.log("Lots Account", lotsAccount.publicKey.toBase58());

      await signSendAndConfirmIxs(
        [
          createOffersAccountInstruction,
          createLotsAccountInstruction,
          ...createUSDCMintInstruction,
          initializeInstruction,
        ],
        [offersAccount, lotsAccount, _usdcMintKeyPair, certificationMint]
      );
      return loadContract(contractPK);
    },
    [program, anchorWallet, signSendAndConfirmIxs, loadContract]
  );

  useEffect(() => {
    if (!_contract || !program) return;
    const loadLots = async () => {
      const lots = await program.account.lots.fetch(_contract.lotsAccount);
      setLots(lots);
    };
    loadLots();
  }, [_contract, program]);

  useEffect(() => {
    if (!_contract || !program) return;
    const loadOffers = async () => {
      const offers = await program.account.offers.fetch(
        _contract.offersAccount
      );
      setOffers(offers);
    };
    loadOffers();
  }, [_contract, program]);

  return (
    <ProgramContext.Provider
      value={{
        program,
        contract: _contract,
        contractAddress: _contractAddress,
        useInitialize: initialize,
        useLoadContract: loadContract,
        lots,
        offers,
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
