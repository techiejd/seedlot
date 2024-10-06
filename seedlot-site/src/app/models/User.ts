import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fetches user data based on the wallet's public key and triggers authentication if the user is found.
 *
 * @param {string} publicKey - The public key of the user's wallet.
 * @returns {Promise<Object | null>} - The user object or null if not found.
 */
export async function getUserByWalletAddress(publicKey: string) {
  let user;

  try {
    user = await prisma.user.findFirst({
      where: {
        walletAddress: publicKey.toString(), // Assuming publicKey can be converted to a string
      },
      include: {
        role: true, // This will include the role relation
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Unable to fetch user data");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }
  return user;
}

export async function createUser(
  publicKey: string,
  name: string,
  roleId: number
) {
  let user;
  try {
    user = await prisma.user.create({
      data: {
        walletAddress: publicKey,
        name,
        roleId: roleId,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Unable to create user");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }

  return user;
}


export async function getAllUsers(query?: string) {
  let users;
  try {
    users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { role: { is: { name: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : undefined, // If no query, don't apply a filter
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Unable to fetch user data");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }
  return users;
}