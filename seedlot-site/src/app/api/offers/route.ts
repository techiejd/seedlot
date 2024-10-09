import { NextRequest, NextResponse } from "next/server";
import { getAllFarms } from "../../models/AvailableFarm";
import { stringify } from "querystring";
import { PrismaClient } from "@prisma/client";

interface Offer {
  location: string,
  treeVarietal: string,
  price: number
}

const prisma = new PrismaClient();

// Move this to DB
// number in cents
const priceList = {
  "toraja-typica" : 2000,
  "toraja-sl795" : 1500,
  "toraja-catuai" : 1500,
  "kintamani-catuai" : 1200,
  "sarawak-liberica" : 1200
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {
    const farms = await getAllFarms();
    const offers: Offer[] = [];
    farms.forEach((farm) => {
      console.log(farm.name)
      farm.TreesAtFarm.forEach((tree) => {
        const key = `${farm.name.toLowerCase()}-${tree.treeVariety.name.toLowerCase()}` as keyof typeof priceList;
        offers.push({ location: farm.name, treeVarietal: tree.treeVariety.name, price: priceList[key] });
      });
    })
    console.log(offers)

    return new NextResponse(JSON.stringify({ offers }), { status: 200 });
  } catch (error) {
    console.log("Custom Error fetching all farms:", error);
    return new NextResponse(
      JSON.stringify({ error: `Error fetching all farms` }),
      {
        status: 500,
      }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const { farmName, treeVarietal, mintAddress } = await request.json();

    // Assuming you have a function to update the mint address in the database
    const updated = await updateMintAddress(farmName, treeVarietal, mintAddress);

    if (updated) {
      return new NextResponse(
        JSON.stringify({ message: "Mint address updated successfully" }),
        { status: 200 }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Failed to update mint address" }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.log("Custom Error updating mint address:", error);
    return new NextResponse(
      JSON.stringify({ error: `Error updating mint address` }),
      {
        status: 500,
      }
    );
  }
}

async function updateMintAddress(farmName: string, treeVarietal: string, mintAddress: string): Promise<boolean> {
  // Implement the logic to update the mint address in the database
  // This is a placeholder function and should be replaced with actual database update logic

  console.log(`Updating mint address for ${farmName} - ${treeVarietal} to ${mintAddress}`);
  return true;
}