import { web3 } from "@coral-xyz/anchor";
import {
  initialize,
  MintMetadata,
  program,
  TOTAL_OFFERS,
} from "../client/utils";
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("Offers", () => {
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let offersAccount: web3.Keypair;
  beforeAll(async () => {
    ({ admin, contractPK, offersAccount } = await initialize());
  });
  it("Works with a single offer", async () => {
    const orderMint = web3.Keypair.generate();
    const orderMintMetadata: MintMetadata = {
      name: `Offer Mint`,
      symbol: `OFFER`,
      uri: `https://example.com/offer/`,
      locationVarietyPrice: [`location`, `variety`, `price`],
    };
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      offersAccount: offersAccount.publicKey,
      orderMint: orderMint.publicKey,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    await program.methods
      .addOffer(orderMintMetadata)
      .accounts(accounts)
      .signers([admin, orderMint])
      .rpc();
    const metadata = await getTokenMetadata(
      program.provider.connection,
      orderMint.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(metadata.name).toEqual(orderMintMetadata.name);
    expect(metadata.symbol).toEqual(orderMintMetadata.symbol);
    expect(metadata.uri).toEqual(orderMintMetadata.uri);
    expect(metadata.additionalMetadata).toEqual([
      ["location", `location`],
      ["variety", `variety`],
      ["price", `price`],
    ]);
    const offers = await program.account.offers.fetch(offersAccount.publicKey);
    expect(offers.offers[0].mint.equals(orderMint.publicKey)).toBe(true);
    expect(offers.tail.eqn(1)).toBe(true);
  });
  // TODO(techiejd): https://github.com/kevinheavey/solana-bankrun/issues/28
  /*
  it("Allows the admin to add an offer until the limit is reached", async () => {
    const orderMints = [];
    await Promise.all(
      [...Array(TOTAL_OFFERS)].map(async (_, i) => {
        const orderMint = web3.Keypair.generate();
        orderMints.push(orderMint.publicKey);
        const orderMintMetadata: MintMetadata = {
          name: `Offer Mint ${i}`,
          symbol: `OFFER${i}`,
          uri: `https://example.com/offer/${i}`,
          locationVarietyPrice: [`location${i}`, `variety${i}`, `price${i}`],
        };
        const accounts = {
          admin: admin.publicKey,
          contract: contractPK,
          offersAccount: offersAccount.publicKey,
          orderMint: orderMint.publicKey,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        };
        await program.methods
          .addOffer(orderMintMetadata)
          .accounts(accounts)
          .signers([admin, orderMint])
          .rpc();
        const metadata = await getTokenMetadata(
          program.provider.connection,
          orderMint.publicKey,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(metadata.name).toEqual(orderMintMetadata.name);
        expect(metadata.symbol).toEqual(orderMintMetadata.symbol);
        expect(metadata.uri).toEqual(orderMintMetadata.uri);
        expect(metadata.additionalMetadata).toEqual([
          ["location", `location${i}`],
          ["variety", `variety${i}`],
        ]);
        return "done";
      })
    );
    const offers = await program.account.offers.fetch(offersAccount.publicKey);
    orderMints.map((o) =>
      expect(
        offers.offers.find((offer) => offer.mint.equals(o))
      ).not.toBeUndefined()
    );
    expect(offers.tail.eqn(TOTAL_OFFERS)).toBe(true);

    const overFlowOffer = web3.Keypair.generate();
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      offersAccount: offersAccount.publicKey,
      orderMint: overFlowOffer.publicKey,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    };
    await expect(
      program.methods
        .addOffer({
          name: `Offer Mint ${TOTAL_OFFERS}`,
          symbol: `OFFER${TOTAL_OFFERS}`,
          uri: `https://example.com/offer/${TOTAL_OFFERS}`,
          locationVariety: [
            `location${TOTAL_OFFERS}`,
            `variety${TOTAL_OFFERS}`,
            `price${TOTAL_OFFERS}`,
          ],
        })
        .accounts(accounts)
        .signers([admin, overFlowOffer])
        .rpc()
    ).rejects.toThrow("OffersFull");
  }, 15000); */
});
