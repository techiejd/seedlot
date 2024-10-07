import * as anchor from "@coral-xyz/anchor";
import {
  airdrop,
  initialize,
  TREES_PER_LOT,
  MintMetadata,
  PRICE_PER_TREE,
  program,
  LOT_PRICE_IN_USDC,
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

describe("Offers", () => {
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
    const _1000Dollars = 1000 * 100 * 10 ** 6;
    await mintTo(
      program.provider.connection,
      user,
      usdc.mint,
      userAta.address,
      usdc.authority,
      _1000Dollars
    );
    orderMint = anchor.web3.Keypair.generate();
    const orderMintMetadata: MintMetadata = {
      name: `Offer Mint`,
      symbol: `OFFER`,
      uri: `https://example.com/offer/`,
      locationVarietyPrice: [`location`, `variety`, PRICE_PER_TREE],
      managerForLot: null,
    };
    const accounts = {
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
      .accounts(accounts)
      .signers([admin, orderMint])
      .rpc();
  }, 15000);
  it("Gives a user tokens for how many they order", async () => {
    const numOrders = 5;
    const userTokenAccount = getAssociatedTokenAddressSync(
      orderMint.publicKey,
      user.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const accounts = {
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

    // Get the number of USDC tokens the user has before the order
    const userUsdcAccountBefore = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      usdc.mint,
      user.publicKey
    );

    await program.methods
      .placeOrder(new anchor.BN(0), new anchor.BN(numOrders))
      .accounts(accounts)
      .signers([user])
      .rpc();

    const userTokenAccountAfter = await getOrCreateAssociatedTokenAccount(
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
    expect(userTokenAccountAfter.amount).toEqual(BigInt(numOrders));
    const userUsdcAccountAfter = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      user,
      usdc.mint,
      user.publicKey
    );
    expect(userUsdcAccountAfter.amount).toBeLessThan(
      userUsdcAccountBefore.amount
    );
    expect(userUsdcAccountAfter.amount).toBe(
      userUsdcAccountBefore.amount - BigInt(numOrders * LOT_PRICE_IN_USDC)
    );
  });
});
