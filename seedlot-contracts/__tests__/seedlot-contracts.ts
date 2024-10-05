import * as anchor from "@coral-xyz/anchor";
import { web3 } from "@coral-xyz/anchor";
import {
  getMint,
  getExtensionTypes,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata,
} from "@solana/spl-token";
import {
  Contract,
  airdrop,
  program,
  MIN_TREES_PER_LOT,
  LOT_PRICE,
  confirmTx,
  CERTIFICATION_MINT_METADATA,
  initializeOffers,
  TOTAL_OFFERS,
} from "../client/utils";

describe("initializing", () => {
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let contract: Contract;
  let certificationMint: web3.Keypair;
  let offersAccount: web3.Keypair;
  beforeAll(async () => {
    admin = web3.Keypair.generate();
    await airdrop(admin.publicKey);
  });

  describe("success", () => {
    beforeAll(async () => {
      [contractPK] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("contract"), admin.publicKey.toBuffer()],
        program.programId
      );
      certificationMint = web3.Keypair.generate();
      offersAccount = await initializeOffers(admin);
      const accounts = {
        admin: admin.publicKey,
        contract: contractPK,
        offersAccount: offersAccount.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        certificationMint: certificationMint.publicKey,
      };

      const txHash = await program.methods
        .initialize(MIN_TREES_PER_LOT, LOT_PRICE, CERTIFICATION_MINT_METADATA)
        .accounts(accounts)
        .signers([admin, certificationMint])
        .preInstructions([
          anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
            units: 800_000,
          }),
        ])
        .rpc();

      await confirmTx(txHash);
      contract = await program.account.contract.fetch(contractPK);
    });

    it("Sets admin as the owner", async () => {
      expect(contract.admin).toStrictEqual(admin.publicKey);
    });
    it("Sets the number of minimum trees in a lot", async () => {
      expect(contract.minTreesPerLot.eq(MIN_TREES_PER_LOT)).toBe(true);
    });
    it("Sets the price of a lot", async () => {
      expect(contract.lotPrice.eq(LOT_PRICE)).toBe(true);
    });
    describe("certification Mint", () => {
      it("Sets a certification mint", () => {
        expect(contract.certificationMint).toBeDefined();
        expect(contract.certificationMint).toEqual(certificationMint.publicKey);
      });
      it("Sets the certification mint with correct Token settings", async () => {
        // TODO(techiejd): Move this to a test for makeMint
        const mintInfo = await getMint(
          program.provider.connection,
          contract.certificationMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        expect(mintInfo.freezeAuthority).toEqual(contractPK);
        expect(mintInfo.mintAuthority).toEqual(contractPK);
        expect(mintInfo.supply).toEqual(BigInt(0));
        expect(mintInfo.isInitialized).toBe(true);
        expect(mintInfo.decimals).toEqual(0);

        const extensionTypes = getExtensionTypes(mintInfo.tlvData);
        expect(extensionTypes).toContain(ExtensionType.DefaultAccountState);
      });
      it("Sets the certification mint with correct Token Metadata settings", async () => {
        const metadata = await getTokenMetadata(
          program.provider.connection,
          contract.certificationMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(metadata.name).toEqual(CERTIFICATION_MINT_METADATA.name);
        expect(metadata.symbol).toEqual(CERTIFICATION_MINT_METADATA.symbol);
        expect(metadata.uri).toEqual(CERTIFICATION_MINT_METADATA.uri);
        expect(metadata.additionalMetadata).toEqual([]);
      });
    });
    it("Sets the offers account", async () => {
      expect(contract.offersAccount).toEqual(offersAccount.publicKey);
      const offers = await program.account.offers.fetch(
        offersAccount.publicKey
      );
      expect(offers.owner).toEqual(contractPK);
      expect(offers.tail.eqn(0)).toBe(true);
      expect(offers.offers).toHaveLength(TOTAL_OFFERS);
      expect(
        offers.offers.every((o) => o.mint.equals(web3.SystemProgram.programId))
      ).toBe(true);
    });
    test.todo(
      "Sets the percentage that the managers will receive in taking on an order"
    );
  });
});
