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

describe("confirmingLots", () => {
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
  const setup = async () => {
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
    await mintTo(
      program.provider.connection,
      admin,
      usdc.mint,
      adminUsdcTokenAccount.address,
      usdc.authority,
      _100Dollars
    );
  };

  describe("confirmed", () => {
    beforeAll(async () => {
      await setup();
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
    it("transfers the remaining fee to the manager", async () => {
      const managerUsdcTokenAccount = getAssociatedTokenAddressSync(
        usdc.mint,
        manager.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const managerUsdcTokenAccountBalance =
        await program.provider.connection.getTokenAccountBalance(
          managerUsdcTokenAccount
        );

      console.log(managerUsdcTokenAccountBalance.value.uiAmountString);
      expect(managerUsdcTokenAccountBalance.value.amount).toEqual(
        new anchor.BN(LOT_PRICE_IN_USDC * numLotsPrepared).toString()
      );
    });
    it('changes the lot\'s status to "1"', async () => {
      const lotMintMetadata = await getTokenMetadata(
        program.provider.connection,
        lotMint.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      expect(lotMintMetadata.additionalMetadata).toContainEqual(["state", "1"]);
    });
    it("thaws the user's lot tokens and removes permanent delegate", async () => {
      const lotTokenAccount = await getOrCreateAssociatedTokenAccount(
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

      expect(lotTokenAccount.isFrozen).toBeFalsy();
      expect(lotTokenAccount.delegate).toBeFalsy();
    });
    // TODO(techiejd): Might be better to switch to per account delegate if revoke permanent delegate is not supported.
    test.todo("Revokes permanent delegate from the lot mint");
    test.todo("Revokes close authority from the lot mint");
  });
  describe("denied", () => {
    beforeAll(async () => {
      await setup();
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
      console.log({ confirmAccounts });
      console.log({ publicKey: program.provider.publicKey });
      console.log(
        await program.provider.connection.getBalance(program.provider.publicKey)
      );
      await airdrop(program.provider.publicKey);
      console.log(
        await program.provider.connection.getBalance(program.provider.publicKey)
      );
      await airdrop(contractPK);
      console.log(
        await program.methods
          .confirmLots(false, new anchor.BN(0), new anchor.BN(0))
          .accounts(confirmAccounts)
          .signers([admin])
          .transaction()
      );
      await program.methods
        .confirmLots(false, new anchor.BN(0), new anchor.BN(0))
        .accounts(confirmAccounts)
        .signers([admin])
        .rpc()
        .catch(async (e) => {
          if (e instanceof SendTransactionError) {
            console.log(await e.getLogs(program.provider.connection));
          }
        });
    }, 15000);
    it("does not transfer any funds to the manager", async () => {
      const managerUsdcTokenAccount = getAssociatedTokenAddressSync(
        usdc.mint,
        manager.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const managerUsdcTokenAccountBalance =
        await program.provider.connection.getTokenAccountBalance(
          managerUsdcTokenAccount
        );

      console.log(managerUsdcTokenAccountBalance.value.uiAmountString);
      expect(managerUsdcTokenAccountBalance.value.amount).toEqual(
        new anchor.BN(LOT_PRICE_IN_USDC * numLotsPrepared * 0.1).toString()
      );
    });
    it("replenishes the 10% of the lot's original price to the contract", async () => {
      const contractUsdcTokenAccountBalance =
        await program.provider.connection.getTokenAccountBalance(
          contractUsdcTokenAccount
        );

      expect(contractUsdcTokenAccountBalance.value.amount).toEqual(
        new anchor.BN(LOT_PRICE_IN_USDC * numOrders).toString()
      );
    });
    it("(re)-mints the order tokens to the user", async () => {
      const userOrderTokenAccountBalance =
        await program.provider.connection.getTokenAccountBalance(
          userOrderTokenAccount
        );

      expect(userOrderTokenAccountBalance.value.amount).toEqual(
        new anchor.BN(numOrders).toString()
      );
    });
    it("closes the lot mint", async () => {
      await expect(
        getMint(
          program.provider.connection,
          lotMint.publicKey,
          undefined,
          TOKEN_2022_PROGRAM_ID
        )
      ).rejects.toThrow();
    });
    it("decertifies the manager", async () => {
      const managerCertificationTokenAccount =
        await getOrCreateAssociatedTokenAccount(
          program.provider.connection,
          manager,
          certificationMint.publicKey,
          manager.publicKey,
          false,
          undefined,
          undefined,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
      expect(managerCertificationTokenAccount.amount).toEqual(5n);
    });
  });
});
