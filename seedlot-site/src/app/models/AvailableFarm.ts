"use server"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllFarms() {
    try {
        const farms = await prisma.availableFarms.findMany({
            include: {
            TreesAtFarm: {
                include: {
                    treeVariety: true,
                },
            },
            },
        });
        return farms;
    } catch (error) {
        console.error("Error fetching farms:", error);
        throw error;
    }
}
