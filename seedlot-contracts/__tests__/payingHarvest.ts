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
  getAssociatedTokenAddressSync,
  getMint,
  getOrCreateAssociatedTokenAccount,
  getTokenMetadata,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SendTransactionError } from "@solana/web3.js";

describe("payingHarvest", () => {
  let admin: anchor.web3.Keypair;
  let contractPK: anchor.web3.PublicKey;
  let offersAccount: anchor.web3.Keypair;
  let usdc: { mint: anchor.web3.PublicKey; authority: anchor.web3.Keypair };
  let contractUsdcTokenAccount: anchor.web3.PublicKey;
  let user: anchor.web3.Keypair;
  let orderMint: anchor.web3.Keypair;
  let userAta: Account;
  let userOrderTokenAccount: anchor.web3.PublicKey;
  let lotsAccount: anchor.web3.Keypair;
  let manager: anchor.web3.Keypair;
  let lotMint: anchor.web3.Keypair;
  let userLotTokenAccount: anchor.web3.PublicKey;
  let certificationMint: anchor.web3.Keypair;
  let adminUsdcTokenAccount: Awaited<
    ReturnType<typeof getOrCreateAssociatedTokenAccount>
  >;
  const numOrders = 5;
  const numLotsPrepared = 3;
  const _100Dollars = 100 * 100 * 10 ** 6;
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
      certificationMint: certificationMint.publicKey,
    };

    await program.methods
      .placeOrder(new anchor.BN(0), new anchor.BN(numOrders))
      .accounts(placeOrderAccounts)
      .signers([user])
      .rpc();

    manager = anchor.web3.Keypair.generate();
    lotMint = anchor.web3.Keypair.generate();
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

    userLotTokenAccount = getAssociatedTokenAddressSync(
      lotMint.publicKey,
      user.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

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
      contractUsdcTokenAccount: contractUsdcTokenAccount,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    };

    await program.methods
      .prepareLots(
        new anchor.BN(0),
        new anchor.BN(numLotsPrepared),
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

    adminUsdcTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      admin,
      usdc.mint,
      admin.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const confirmAccounts = {
      admin: admin.publicKey,
      contract: contractPK,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
      usdcMint: usdc.mint,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      lotsAccount: lotsAccount.publicKey,
      lotMint: lotMint.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      user: user.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      offersAccount: offersAccount.publicKey,
      orderMint: orderMint.publicKey,
    };
    await program.methods
      .confirmLots(true, new anchor.BN(0), new anchor.BN(0))
      .accounts(confirmAccounts)
      .signers([admin])
      .rpc();
  }, 15000);

  it("Should pay the manager for the harvest and split the profit 25/25/50 between manager, admin, and user", async () => {
    const costOfHarvest = 15000; // 100 dollars
    const profit = 20000; // 200 dollars
    const costOfHarvestInUsdc = 15000 * 10 ** 4; // 100 dollars
    const profitInUsdc = 20000 * 10 ** 4; // 200 dollars
    const payer = anchor.web3.Keypair.generate();
    await airdrop(payer.publicKey);

    const [
      userUsdcTokenAccountBefore,
      adminUsdcTokenAccountBefore,
      managerUsdcTokenAccountBefore,
      payerUsdcTokenAccountBefore,
    ] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        user,
        usdc.mint,
        user.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        admin,
        usdc.mint,
        admin.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        manager,
        usdc.mint,
        manager.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        payer,
        usdc.mint,
        payer.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
    ]);

    await mintTo(
      program.provider.connection,
      payer,
      usdc.mint,
      payerUsdcTokenAccountBefore.address,
      usdc.authority,
      _100Dollars * 10 // 1000 dollars. Although, I'm not sure it's actually 100 dollars to begin with.
    );

    const harvestAccounts = {
      contract: contractPK,
      payer: payer.publicKey,
      user: user.publicKey,
      manager: manager.publicKey,
      admin: admin.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      usdcMint: usdc.mint,
      tokenProgramStandard: TOKEN_PROGRAM_ID,
      lotsAccount: lotsAccount.publicKey,
      lotMint: lotMint.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    await program.methods
      .payHarvest(
        new anchor.BN(0) /** lotIndex */,
        new anchor.BN(costOfHarvest) /** harvestAmount */,
        new anchor.BN(profit) /** profit */
      )
      .accounts(harvestAccounts)
      .signers([payer])
      .rpc();

    const [
      userUsdcTokenAccountAfter,
      adminUsdcTokenAccountAfter,
      managerUsdcTokenAccountAfter,
      payerUsdcTokenAccountAfter,
    ] = await Promise.all([
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        user,
        usdc.mint,
        user.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        admin,
        usdc.mint,
        admin.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        manager,
        usdc.mint,
        manager.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
      getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        payer,
        usdc.mint,
        payer.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      ),
    ]);

    expect(userUsdcTokenAccountAfter.amount).toEqual(
      userUsdcTokenAccountBefore.amount + BigInt(profitInUsdc / 2)
    );
    expect(adminUsdcTokenAccountAfter.amount).toEqual(
      adminUsdcTokenAccountBefore.amount + BigInt(profitInUsdc / 4)
    );
    expect(managerUsdcTokenAccountAfter.amount).toEqual(
      managerUsdcTokenAccountBefore.amount +
        BigInt(profitInUsdc / 4) +
        BigInt(costOfHarvestInUsdc)
    );

    expect(payerUsdcTokenAccountAfter.amount).toEqual(
      BigInt(_100Dollars * 10) -
        BigInt(profitInUsdc) -
        BigInt(costOfHarvestInUsdc)
    );
  });
});
