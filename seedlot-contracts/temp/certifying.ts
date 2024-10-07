import { web3 } from "@coral-xyz/anchor";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  createTransferInstruction,
  createBurnInstruction,
} from "@solana/spl-token";
import {
  CertificationTier,
  initialize,
  airdrop,
  program,
  confirmTx,
} from "../client/utils";

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

describe("Certifying", () => {
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let certificationMint: web3.Keypair;
  let manager: web3.Keypair;
  let managerAta: web3.PublicKey;
  beforeAll(async () => {
    ({ admin, contractPK, certificationMint } = await initialize());
  });
  beforeEach(async () => {
    manager = web3.Keypair.generate();
    managerAta = await getAssociatedTokenAddress(
      certificationMint.publicKey,
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
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
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
      associatedTokenProgram: web3.PublicKey;
      systemProgram: web3.PublicKey;
      manager: web3.PublicKey;
      certificationMint: web3.PublicKey;
    };
    beforeEach(async () => {
      accounts = {
        admin: admin.publicKey,
        contract: contractPK,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        managerTo: managerAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
        manager: manager.publicKey,
        certificationMint: certificationMint.publicKey,
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
  it("Cannot be transferred", async () => {
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
    };
    await program.methods
      .certify({ tier1: {} })
      .accounts(accounts)
      .signers([admin])
      .rpc();
    await airdrop(manager.publicKey);
    const toManager = web3.Keypair.generate();
    const toManagerAta = await getAssociatedTokenAddress(
      certificationMint.publicKey,
      toManager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const transferInstruction = createTransferInstruction(
      managerAta,
      toManagerAta,
      manager.publicKey,
      1,
      [],
      TOKEN_2022_PROGRAM_ID
    );
    await expect(
      web3.sendAndConfirmTransaction(
        program.provider.connection,
        new web3.Transaction().add(transferInstruction),
        [manager]
      )
    ).rejects.toThrow("Account is frozen");
    const managerTokenAccount = await getAccount(
      program.provider.connection,
      managerAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerTokenAccount.amount).toBe(1n);
  });
  it("Cannot be burned", async () => {
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
    };
    await program.methods
      .certify({ tier1: {} })
      .accounts(accounts)
      .signers([admin])
      .rpc();
    await airdrop(manager.publicKey);
    const burnInstruction = createBurnInstruction(
      managerAta,
      certificationMint.publicKey,
      manager.publicKey,
      1,
      [],
      TOKEN_2022_PROGRAM_ID
    );
    await expect(
      web3.sendAndConfirmTransaction(
        program.provider.connection,
        new web3.Transaction().add(burnInstruction),
        [manager]
      )
    ).rejects.toThrow("Account is frozen");
    const managerTokenAccount = await getAccount(
      program.provider.connection,
      managerAta,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerTokenAccount.amount).toBe(1n);
  });
});

describe("Decertifying", () => {
  const DECERTIFIED_TIER_TOKEN_AMOUNT = 5n;
  let admin: web3.Keypair;
  let contractPK: web3.PublicKey;
  let certificationMint: web3.Keypair;
  beforeAll(async () => {
    ({ admin, contractPK, certificationMint } = await initialize());
  });
  test.todo("Only allows admin to decertify.");
  test.todo("Admin and manager need to be different.");
  it("Allows for non certified manager to be decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      certificationMint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
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
            certificationMint.publicKey,
            manager.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
          );
          const accounts = {
            admin: admin.publicKey,
            contract: contractPK,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            managerTo: managerAta,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
            manager: manager.publicKey,
            certificationMint: certificationMint.publicKey,
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
  }, 15000);
  it("Cannot decertify if already decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      certificationMint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
    };
    await program.methods.decertify().accounts(accounts).signers([admin]).rpc();
    await expect(
      program.methods.decertify().accounts(accounts).signers([admin]).rpc()
    ).rejects.toThrow("Error Code: ManagerAlreadyDecertified");
  });
  it("Cannot certify if already decertified.", async () => {
    const manager = web3.Keypair.generate();
    const managerAta = await getAssociatedTokenAddress(
      certificationMint.publicKey,
      manager.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const accounts = {
      admin: admin.publicKey,
      contract: contractPK,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      managerTo: managerAta,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      manager: manager.publicKey,
      certificationMint: certificationMint.publicKey,
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
