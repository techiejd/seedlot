import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SeedlotContracts } from "../target/types/seedlot_contracts";
import * as utils from "../client/utils";
import {
  getMint,
  getTokenMetadata,
  getExtensionTypes,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

describe("initializing", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  type Contract = anchor.IdlAccounts<SeedlotContracts>["contract"];
  const program = anchor.workspace
    .SeedlotContracts as Program<SeedlotContracts>;
  const confirmTx = (txHash: string) => utils.confirmTx(txHash, program);
  const airdrop = (addy: web3.PublicKey) => utils.airdrop(addy, program);

  const MIN_TREES_PER_LOT = new anchor.BN(10);
  const LOT_PRICE = new anchor.BN(200);

  let admin: web3.Keypair;
  let newCertificationNftMint: web3.Keypair;

  beforeAll(async () => {
    admin = web3.Keypair.generate();
    await airdrop(admin.publicKey);

    // Generate a new Keypair for the mint account
    newCertificationNftMint = web3.Keypair.generate();
    console.log(newCertificationNftMint.publicKey);
  });

  describe("fails initializing", () => {
    it("fails if seed does not include only admin", async () => {
      const someOtherAdmin = web3.Keypair.generate();
      const [failingContractPK0] = web3.PublicKey.findProgramAddressSync(
        [],
        program.programId
      );
      const accounts0 = {
        contract: failingContractPK0,
        admin: admin.publicKey,
        newCertificationNftMint: newCertificationNftMint.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
        certificationNftMintAsSigner: newCertificationNftMint.publicKey,
      };
      await expect(
        program.methods
          .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
          .accounts(accounts0)
          .signers([admin, newCertificationNftMint])
          .rpc()
      ).rejects.toThrow("ConstraintSeeds");
      const [failingContractPK1] = web3.PublicKey.findProgramAddressSync(
        [admin.publicKey.toBuffer(), someOtherAdmin.publicKey.toBuffer()],
        program.programId
      );
      const accounts1 = {
        contract: failingContractPK1,
        admin: admin.publicKey,
        newCertificationNftMint: newCertificationNftMint.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
        certificationNftMintAsSigner: newCertificationNftMint.publicKey,
      };
      await expect(
        program.methods
          .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
          .accounts(accounts1)
          .signers([admin, newCertificationNftMint])
          .rpc()
      ).rejects.toThrow("ConstraintSeeds");
    });
  });

  describe("success", () => {
    let contractPK: web3.PublicKey;
    let contract: Contract;
    let newCertificationNftMint: web3.Keypair;

    beforeAll(async () => {
      console.log("AYO RUNNING");
      // Generate a new Keypair for the mint account
      newCertificationNftMint = web3.Keypair.generate();
      console.log(
        "New Certification NFT Mint:",
        newCertificationNftMint.publicKey.toString()
      );

      console.log("TOKEN_2022_PROGRAM_ID: ", TOKEN_2022_PROGRAM_ID.toString());

      [contractPK] = web3.PublicKey.findProgramAddressSync(
        [admin.publicKey.toBuffer()],
        program.programId
      );
      const accounts = {
        admin: admin.publicKey,
        contract: contractPK,
        newCertificationNftMint: newCertificationNftMint.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY,
        certificationNftMintAsSigner: newCertificationNftMint.publicKey,
      };
      const txHash = await program.methods
        .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
        .accounts(accounts)
        .signers([admin, newCertificationNftMint])
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
    describe("certification NFT", () => {
      it("Sets a certification NFT mint", () => {
        expect(contract.certificationNftMint).toBeDefined();
        expect(contract.certificationNftMint).toBeInstanceOf(web3.PublicKey);
      });
      it("Sets the certification NFT mint with correct Token settings", async () => {
        const mintInfo = await getMint(
          program.provider.connection,
          contract.certificationNftMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        expect(mintInfo.freezeAuthority).toBeNull();
        expect(mintInfo.mintAuthority).toEqual(contractPK);
        expect(mintInfo.supply).toEqual(new anchor.BN(0));
        expect(mintInfo.isInitialized).toBe(true);
        expect(mintInfo.decimals).toEqual(0);

        const extensionTypes = getExtensionTypes(mintInfo.tlvData);
        expect(extensionTypes).toContain(ExtensionType.NonTransferable);
      });
      it("Sets the certification NFT mint with correct Token Metadata settings", async () => {
        const metadata = await getTokenMetadata(
          program.provider.connection,
          contract.certificationNftMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(metadata.name).toEqual("Seedlot Certification");
        expect(metadata.symbol).toEqual("SEEDLOT-CERT");
        expect(metadata.uri).toEqual("");
      });
    });
    test.todo("Sets an expiration time for the certifications");
    test.todo("Sets a time before expiration time for re-certification");
    test.todo("Sets an Semi-fungible token mint for ordering tree lots");
    test.todo(
      "Sets the percentage that the managers will receive in taking on an order"
    );
  });
});

describe("Certifying", () => {
  test.todo("Only allows admin to certify.");
  test.todo("Admin and manager need to be different.");
  test.todo("Must be signed by the manager receiving the certification.");
  test.todo("Does not allow for multiple certifications.");
  test.todo("Allows for re-certification after expiration.");
  test.todo(
    "Allows for re-certification before expiration but only in the window given by the before expiration time."
  );
});

describe("Decertifying", () => {
  test.todo("Only allows admin to decertify.");
  test.todo("Admin and manager need to be different.");
  test.todo("Does not allow for non certified manager to be decertified.");
  test.todo("Allows for re-certification after expiration.");
  test.todo(
    "Allows for re-certification before expiration but only in the window given by the before expiration time."
  );
});

describe("Ordering", () => {
  test.todo("Takes USDC for the number of lots ordered.");
  test.todo("Issues semi-fungible tokens to be fulfilled later.");
  test.todo("Freezes the tokens so that they cannot be moved");
});

describe("Claiming", () => {
  test.todo("Only allows for certified managers to claim orders");
  test.todo(
    "Allows for the manager to receive the aforementioned percentage right away"
  );
  test.todo("Adds the manager as the claimer for the lots they took");
  test.todo(
    "Lets the manager to partially claim the order and lets others claim the rest."
  );
  test.todo("Does not let another manager take over a claimed portion.");
});

describe("Fulfilling", () => {
  test.todo("Can only be called by admin");
  test.todo("Only allows for the manager who claimed the order to fulfill it.");
  describe("Successfully fulfilled", () => {
    test.todo("Allows for the manager to receive the remaining percentage");
    test.todo("Unfreezes the tokens so that they can be moved");
  });
  describe("Unsuccessfully fulfilled", () => {
    test.todo(
      "Requires admins to replace the money originally given to the manager to claim the order"
    );
    test.todo("Decertifies the manager");
    test.todo("Removes the manager as the claimer for the lots they took");
  });
});
