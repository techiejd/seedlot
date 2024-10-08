"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getContractPK = async () => {
  let contract;
  try {
    contract = await prisma.programContract.findFirst();
  } catch (error) {
    console.error("Error fetching contract data:", error);
    throw new Error("Unable to fetch contract data");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }
  return contract;
};

export default getContractPK;