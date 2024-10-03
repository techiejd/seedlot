import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { SeedlotContracts } from "../target/types/seedlot_contracts";
import * as utils from "../client/utils";
import {
  getMint,
  getExtensionTypes,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from "@solana/spl-token";

anchor.setProvider(anchor.AnchorProvider.env());
type Contract = anchor.IdlAccounts<SeedlotContracts>["contract"];
type CertificationTier = anchor.IdlTypes<SeedlotContracts>["certificationTier"];
const program = anchor.workspace.SeedlotContracts as Program<SeedlotContracts>;
const confirmTx = (txHash: string) => utils.confirmTx(txHash, program);
const airdrop = (addy: web3.PublicKey) => utils.airdrop(addy, program);

const makeMint = async (admin: web3.Keypair, contractPK: web3.PublicKey) => {
  const mint = web3.Keypair.generate();
  const mintPK = mint.publicKey;

  const mintSpace = getMintLen([ExtensionType.NonTransferable]);
  const lamports =
    await program.provider.connection.getMinimumBalanceForRentExemption(
      mintSpace
    );

  const transaction = new web3.Transaction().add(
    web3.SystemProgram.createAccount({
      fromPubkey: admin.publicKey,
      newAccountPubkey: mintPK,
      space: mintSpace,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(
      mintPK,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintPK,
      0,
      contractPK,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const txHash = await web3.sendAndConfirmTransaction(
    program.provider.connection,
    transaction,
    [admin, mint]
  );

  return { txHash, mint };
};

const MIN_TREES_PER_LOT = new anchor.BN(10);
const LOT_PRICE = new anchor.BN(200);

enum ClientCertificationTierMirror {
  undefined = 0,
  tier1 = 1,
  tier2 = 2,
  tier3 = 3,
  tier4 = 4,
  decertified = 5,
}

const numberToClientCertificationTierMirror: { [key: number]: string } = {};
for (const key in ClientCertificationTierMirror) {
  if (typeof ClientCertificationTierMirror[key] === "number") {
    numberToClientCertificationTierMirror[ClientCertificationTierMirror[key]] =
      key;
  }
}

const convertToCertificationTier = (tier: number) => {
  return {
    [numberToClientCertificationTierMirror[tier]]: {},
  } as CertificationTier;
};

describe("initializing", () => {
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let contract: Contract;
  let mint: web3.Keypair;
  beforeAll(async () => {
    admin = web3.Keypair.generate();
    await airdrop(admin.publicKey);
  });

  describe("fails initializing", () => {
    it("fails if seed does not include only admin", async () => {
      const someOtherAdmin = web3.Keypair.generate();
      const [failingContractPK0] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("contract")],
        program.programId
      );
      const { mint } = await makeMint(admin, failingContractPK0);
      const accounts0 = {
        contract: failingContractPK0,
        admin: admin.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        mintAsSigner: mint.publicKey,
      };
      await expect(
        program.methods
          .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
          .accounts(accounts0)
          .signers([admin, mint])
          .rpc()
      ).rejects.toThrow("ConstraintSeeds");
      const [failingContractPK1] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("contract"),
          admin.publicKey.toBuffer(),
          someOtherAdmin.publicKey.toBuffer(),
        ],
        program.programId
      );
      const accounts1 = {
        contract: failingContractPK1,
        admin: admin.publicKey,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        mintAsSigner: mint.publicKey,
      };
      await expect(
        program.methods
          .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
          .accounts(accounts1)
          .signers([admin, mint])
          .rpc()
      ).rejects.toThrow("ConstraintSeeds");
    });
  });

  describe("success", () => {
    let contractPK: web3.PublicKey;
    let contract: Contract;
    let mint: web3.Keypair;

    beforeAll(async () => {
      [contractPK] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("contract"), admin.publicKey.toBuffer()],
        program.programId
      );
      ({ mint } = await makeMint(admin, contractPK));
      const accounts = {
        admin: admin.publicKey,
        contract: contractPK,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        mint: mint.publicKey,
        mintAsSigner: mint.publicKey,
      };
      const txHash = await program.methods
        .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
        .accounts(accounts)
        .signers([admin, mint])
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
        expect(contract.certificationMint).toEqual(mint.publicKey);
      });
      it("Sets the certification mint with correct Token settings", async () => {
        const mintInfo = await getMint(
          program.provider.connection,
          contract.certificationMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );

        expect(mintInfo.freezeAuthority).toBeNull();
        expect(mintInfo.mintAuthority).toEqual(contractPK);
        expect(mintInfo.supply).toEqual(BigInt(0));
        expect(mintInfo.isInitialized).toBe(true);
        expect(mintInfo.decimals).toEqual(0);

        const extensionTypes = getExtensionTypes(mintInfo.tlvData);
        expect(extensionTypes).toContain(ExtensionType.NonTransferable);
      });
      test.todo(
        "Sets the certification mint with correct Token Metadata settings" /*, async () => {
        const metadata = await getTokenMetadata(
          program.provider.connection,
          contract.certificationMint,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(metadata.name).toEqual("Seedlot Certification");
        expect(metadata.symbol).toEqual("SEEDLOT-CERT");
        expect(metadata.uri).toEqual("");
      }*/
      );
    });
    test.todo(
      "Sets the percentage that the managers will receive in taking on an order"
    );
  });
});

const initialize = async () => {
  const admin = web3.Keypair.generate();
  await airdrop(admin.publicKey);

  const [contractPK] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("contract"), admin.publicKey.toBuffer()],
    program.programId
  );
  const { mint } = await makeMint(admin, contractPK);

  const accounts = {
    admin: admin.publicKey,
    contract: contractPK,
    systemProgram: web3.SystemProgram.programId,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    mint: mint.publicKey,
    mintAsSigner: mint.publicKey,
  };
  const txHash = await program.methods
    .initialize(MIN_TREES_PER_LOT, LOT_PRICE)
    .accounts(accounts)
    .signers([admin, mint])
    .rpc();

  const txConfirmation = await confirmTx(txHash);
  return { txConfirmation, contractPK, mint, admin };
};

describe("Certifying", () => {
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let mint: web3.Keypair;
  let manager: web3.Keypair;
  let managerAta: web3.PublicKey;
  beforeAll(async () => {
    ({ admin, contractPK, mint } = await initialize());
  });
  beforeEach(async () => {
    manager = web3.Keypair.generate();
    managerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
  });
  it("Admin and manager need to be different.", async () => {
    await airdrop(manager.publicKey);
    const accounts = {
      admin: manager.publicKey, // Use manager instead of admin
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      certificationMint: mint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
    };
    await expect(
      program.methods
        .certify({ undefined: {} })
        .accounts(accounts)
        .signers([manager])
        .rpc()
    ).rejects.toThrow("Error Code: AdminCannotBeCertified");
  });
  describe("Can only certify at increasing by 1 tiers starting at 1 and ending at 4.", () => {
    let accounts: {
      admin: web3.PublicKey;
      contract: web3.PublicKey;
      tokenProgram: web3.PublicKey;
      managerTo: web3.PublicKey;
      certificationMint: web3.PublicKey;
      associatedTokenProgram: web3.PublicKey;
      systemProgram: web3.PublicKey;
      manager: web3.PublicKey;
    };
    beforeEach(async () => {
      accounts = {
        admin: admin.publicKey,
        contract: contractPK,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        managerTo: managerAta,
        certificationMint: mint.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        manager: manager.publicKey,
      };
    });
    it("Can certify at tiers 1 - 4", async () => {
      for (let tier = 1; tier < 5; tier++) {
        const txHash = await program.methods
          .certify(convertToCertificationTier(tier))
          .accounts(accounts)
          .signers([admin])
          .rpc();
        await confirmTx(txHash);
        // Check that the manager received i token(s)
        const managerTokenAccount = await getAccount(
          program.provider.connection,
          managerAta,
          undefined,
          TOKEN_2022_PROGRAM_ID
        );
        expect(Number(managerTokenAccount.amount)).toBe(tier);
      }
    });
    it("Fails if you try to certify as decertified", async () => {
      for (let tier = 1; tier < 5; tier++) {
        const txHash = await program.methods
          .certify(convertToCertificationTier(tier))
          .accounts(accounts)
          .signers([admin])
          .rpc();
        await confirmTx(txHash);
      }
      await expect(
        program.methods
          .certify({ decertified: {} })
          .accounts(accounts)
          .signers([admin])
          .rpc()
      ).rejects.toThrow("Error Code: CannotCertifyAboveTierFour");
    });
    it("Fails you try to certify at tier 0", async () => {
      await expect(
        program.methods
          .certify({ undefined: {} })
          .accounts(accounts)
          .signers([admin])
          .rpc()
      ).rejects.toThrow("Error Code: NoCertificationTierZero");
    });
    it("Fails you try to certify at a tier that is not one more than the previous tier", async () => {
      await program.methods
        .certify({ tier1: {} })
        .accounts(accounts)
        .signers([admin])
        .rpc();
      await expect(
        program.methods
          .certify({ tier3: {} })
          .accounts(accounts)
          .signers([admin])
          .rpc()
      ).rejects.toThrow("Error Code: CertificationsMustIncreaseByOneTier");
    });
    it("Does not allow for multiple certifications of the same tier.", async () => {
      const txHash = await program.methods
        .certify({ tier1: {} })
        .accounts(accounts)
        .signers([admin])
        .rpc();
      await confirmTx(txHash);
      await expect(
        program.methods
          .certify({ tier1: {} })
          .accounts(accounts)
          .signers([admin])
          .rpc()
      ).rejects.toThrow("Error Code: CertificationsMustIncreaseByOneTier");
    });
  });
});

describe("Decertifying", () => {
  const DECERTIFIED_TIER_TOKEN_AMOUNT = 5n;
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let mint: web3.Keypair;
  beforeAll(async () => {
    ({ admin, contractPK, mint } = await initialize());
  });
  test.todo("Only allows admin to decertify.");
  test.todo("Admin and manager need to be different.");
  it("Allows for non certified manager to be decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      certificationMint: mint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
    };
    const txHash = await program.methods
      .decertify()
      .accounts(accounts)
      .signers([admin])
      .rpc();
    await confirmTx(txHash);
    const managerTokenAccount = await getAccount(
      program.provider.connection,
      managerAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerTokenAccount.amount).toBe(DECERTIFIED_TIER_TOKEN_AMOUNT);
  });
  it("Can decertify at any tier.", async () => {
    await Promise.all(
      [1, 2, 3, 4].map(async (tierUnderTest) => {
        {
          const manager = web3.Keypair.generate();
          const managerAta = await getAssociatedTokenAddress(
            mint.publicKey,
            manager.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          const accounts = {
            admin: admin.publicKey,
            contract: contractPK,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            managerTo: managerAta,
            certificationMint: mint.publicKey,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            manager: manager.publicKey,
          };
          for (let tier = 1; tier <= tierUnderTest; tier++) {
            await program.methods
              .certify(convertToCertificationTier(tier))
              .accounts(accounts)
              .signers([admin])
              .rpc();
          }
          const txHash = await program.methods
            .decertify()
            .accounts(accounts)
            .signers([admin])
            .rpc();
          await confirmTx(txHash);
          const managerTokenAccount = await getAccount(
            program.provider.connection,
            managerAta,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          expect(managerTokenAccount.amount).toBe(
            DECERTIFIED_TIER_TOKEN_AMOUNT
          );
        }
      })
    );
  });
  it("Cannot decertify if already decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      certificationMint: mint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
    };
    await program.methods.decertify().accounts(accounts).signers([admin]).rpc();
    await expect(
      program.methods.decertify().accounts(accounts).signers([admin]).rpc()
    ).rejects.toThrow("Error Code: ManagerAlreadyDecertified");
  });
  it("Cannot certify if already decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      mint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      certificationMint: mint.publicKey,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
    };
    await program.methods.decertify().accounts(accounts).signers([admin]).rpc();
    await expect(
      program.methods
        .certify({ tier1: {} })
        .accounts(accounts)
        .signers([admin])
        .rpc()
    ).rejects.toThrow("Error Code: ManagerAlreadyDecertified");
  });
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
