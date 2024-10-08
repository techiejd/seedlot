import * as anchor from "@coral-xyz/anchor";
import {
  airdrop,
  initialize,
  LOT_PRICE_IN_USDC,
  MintMetadata,
  PRICE_PER_TREE,
  program,
} from "../client/utils";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  getAssociatedTokenAddressSync,
  getExtensionTypes,
  getMint,
  getOrCreateAssociatedTokenAccount,
  getTokenMetadata,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { SendTransactionError } from "@solana/web3.js";

describe("preparingLots", () => {
  let admin: anchor.web3.Keypair;
  let contractPK: anchor.web3.PublicKey;
  let certificationMint: anchor.web3.Keypair;
  let offersAccount: anchor.web3.Keypair;
  let usdc: { mint: anchor.web3.PublicKey; authority: anchor.web3.Keypair };
  let contractUsdcTokenAccount: anchor.web3.PublicKey;
  let user: anchor.web3.Keypair;
  let orderMint: anchor.web3.Keypair;
  let userAta: Account;
  let userOrderTokenAccount: anchor.web3.PublicKey;
  let lotsAccount: anchor.web3.Keypair;
  const numOrders = 5;
  beforeAll(async () => {
    ({
      admin,
      contractPK,
      offersAccount,
      usdc,
      contractUsdcTokenAccount,
      lotsAccount,
      certificationMint,
    } = await initialize());
    user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);
    userAta = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      usdc.mint,
      user.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const _100Dollars = 100 * 100 * 10 ** 6;
    await mintTo(
      program.provider.connection,
      user,
      usdc.mint,
      userAta.address,
      usdc.authority,
      _100Dollars
    );
    orderMint = anchor.web3.Keypair.generate();
    const orderMintMetadata: MintMetadata = {
      name: `Seedlot Offer`,
      symbol: `SO`,
      uri: `https://example.com/offer/`,
      locationVarietyPrice: [`location`, `variety`, PRICE_PER_TREE],
      managerForLot: null,
    };
    const addOfferAccounts = {
      admin: admin.publicKey,
      contract: contractPK,
      offersAccount: offersAccount.publicKey,
      orderMint: orderMint.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    await program.methods
      .addOffer(orderMintMetadata)
      .accounts(addOfferAccounts)
      .signers([admin, orderMint])
      .rpc();
    userOrderTokenAccount = getAssociatedTokenAddressSync(
      orderMint.publicKey,
      user.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const placeOrderAccounts = {
      user: user.publicKey,
      contract: contractPK,
      offersAccount: offersAccount.publicKey,
      offerMint: orderMint.publicKey,
      userTokenAccount: userOrderTokenAccount,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      usdcMint: usdc.mint,
      usdcFrom: userAta.address,
      contractUsdcTokenAccount: contractUsdcTokenAccount,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
    };

    await program.methods
      .placeOrder(new anchor.BN(0), new anchor.BN(numOrders))
      .accounts(placeOrderAccounts)
      .signers([user])
      .rpc();
  }, 15000);

  // We want to check that the user still has the order tokens that the manager did not take.
  // Client lot tokens should be frozen.
  // We want to check that the original_price of the lot is correct.
  // We want to check that the manager has received the payments for preparing the lot.
  it("Allows certified manager to prepare a lot for a user", async () => {
    const manager = anchor.web3.Keypair.generate();
    // TODO(techiejd): Make sure manager can only prepare the amount of lots that the manager is certified for.
    const certifyAccounts = {
      admin: admin.publicKey,
      manager: manager.publicKey,
      contract: contractPK,
      certificationMint: certificationMint.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    await program.methods
      .certify({ tier1: {} })
      .accounts(certifyAccounts)
      .signers([admin])
      .rpc();

    const numLotsToPrepare = 3;
    const lotMint = anchor.web3.Keypair.generate();
    await airdrop(manager.publicKey);
    userOrderTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      orderMint.publicKey,
      user.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ).then((account) => {
      return account.address;
    });

    const userLotTokenAccount = getAssociatedTokenAddressSync(
      lotMint.publicKey,
      user.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const prepareLotsAccounts = {
      user: user.publicKey,
      manager: manager.publicKey,
      contract: contractPK,
      offersAccount: offersAccount.publicKey,
      lotsAccount: lotsAccount.publicKey,
      orderMint: orderMint.publicKey,
      userOrderTokenAccount: userOrderTokenAccount,
      lotMint: lotMint.publicKey,
      userLotTokenAccount,
      usdcMint: usdc.mint,
      certificationMint: certificationMint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };

    await program.methods
      .prepareLots(
        new anchor.BN(0),
        new anchor.BN(numLotsToPrepare),
        manager.publicKey.toBase58()
      )
      .accounts(prepareLotsAccounts)
      .preInstructions([
        anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000,
        }),
      ])
      .signers([manager, lotMint])
      .rpc();

    // We want to check that the user still has the order tokens that the manager did not take.
    const userOrderTokenAccountAfter = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      orderMint.publicKey,
      user.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    expect(userOrderTokenAccountAfter.amount).toEqual(
      BigInt(numOrders - numLotsToPrepare)
    );

    // We want to check that the user has the number of lot tokens that the manager is preparing.
    const lotMintTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      lotMint.publicKey,
      user.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    expect(lotMintTokenAccount.amount).toEqual(BigInt(numLotsToPrepare));
    expect(lotMintTokenAccount.isFrozen).toBe(true);

    // We want to check that the state of the additonal mint is correct. Name, symbol, uri, and additonal metadata is (location, variety, manager pub key, "0")
    const lotMintInfo = await getMint(
      program.provider.connection,
      lotMint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    expect(lotMintInfo.freezeAuthority).toEqual(contractPK);
    expect(lotMintInfo.mintAuthority).toEqual(contractPK);
    expect(lotMintInfo.supply).toEqual(BigInt(numLotsToPrepare));
    expect(lotMintInfo.isInitialized).toBe(true);
    expect(lotMintInfo.decimals).toEqual(0);
    const extensionTypes = getExtensionTypes(lotMintInfo.tlvData);
    expect(extensionTypes).toContain(ExtensionType.DefaultAccountState);

    const lotMintMetadata = await getTokenMetadata(
      program.provider.connection,
      lotMint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(lotMintMetadata.name).toEqual(
      `Seedlot Lot - location variety ${manager.publicKey.toBase58()}`
    );
    expect(lotMintMetadata.symbol).toEqual(`SL`);
    expect(lotMintMetadata.uri).toEqual(
      `https://app.seedlot.io/lot/${manager.publicKey.toBase58()}`
    );
    expect(lotMintMetadata.additionalMetadata).toEqual([
      ["location", "location"],
      ["variety", "variety"],
      ["manager", manager.publicKey.toBase58()],
      ["state", "0"],
    ]);

    const lots = await program.account.lots.fetch(lotsAccount.publicKey);
    expect(lots.lots[0].originalPricePerTree.toString()).toEqual(
      PRICE_PER_TREE
    );
    expect(lots.lots[0].mint).toEqual(lotMint.publicKey);

    // We want to check that the manager has received his payment for preparing the lot, which is 10% of LOT_PRICE_IN_USDC *  numOrders
    const managerUsdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      manager,
      usdc.mint,
      manager.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    expect(managerUsdcTokenAccount.amount).toEqual(
      BigInt(LOT_PRICE_IN_USDC * numLotsToPrepare * 0.1)
    );
  });
});
