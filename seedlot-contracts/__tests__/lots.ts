import * as anchor from "@coral-xyz/anchor";
import {
  airdrop,
  initialize,
  MintMetadata,
  PRICE_PER_TREE,
  program,
} from "../client/utils";
import {
  Account,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("Lots", () => {
  let admin: anchor.web3.Keypair;
  let contractPK: anchor.web3.PublicKey;
  let offersAccount: anchor.web3.Keypair;
  let usdc: { mint: anchor.web3.PublicKey; authority: anchor.web3.Keypair };
  let contractUsdcTokenAccount: anchor.web3.PublicKey;
  let user: anchor.web3.Keypair;
  let orderMint: anchor.web3.Keypair;
  let userAta: Account;
  beforeAll(async () => {
    ({ admin, contractPK, offersAccount, usdc, contractUsdcTokenAccount } =
      await initialize());
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
      name: `Offer Mint`,
      symbol: `OFFER`,
      uri: `https://example.com/offer/`,
      locationVarietyPrice: [`location`, `variety`, PRICE_PER_TREE],
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
    const numOrders = 5;
    const userTokenAccount = getAssociatedTokenAddressSync(
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
      userTokenAccount: userTokenAccount,
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

    // We want to check that the user has the number of lot tokens that the manager is preparing.
    // We want to check that the user still has the order tokens that the manager did not take.
    // Client lot tokens should be frozen.
    // We want to check that the state of the additonal mint is correct. Name, symbol, uri, and additonal metadata is (location, variety, manager pub key, "0")
    // We want to check that the manager has received the payments for preparing the lot.
  }, 15000);
  test.todo("Allows manager to prepare a lot for a user");
});
