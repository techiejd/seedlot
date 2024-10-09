import { NextRequest, NextResponse } from "next/server";
import { getAllFarms } from "../../models/AvailableFarm";

interface Offer {
  location: string,
  treeVarietal: string,
  price: number,
  mintAddress: string | null,
  mintIndex: number | null
}

// Move this to DB
// number in cents
const priceList = {
  "toraja-typica" : 200000,
  "toraja-sl795" : 150000,
  "toraja-catuai" : 150000,
  "kintamani-catuai" : 120000,
  "sarawak-liberica" : 120000
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {
    const farms = await getAllFarms();
    const offers: Offer[] = [];
    farms.forEach((farm) => {
      farm.TreesAtFarm.forEach((tree) => {
        if(!tree.mintAddress) return;
        const key = `${farm.name.toLowerCase()}-${tree.treeVariety.name.toLowerCase()}` as keyof typeof priceList;
        offers.push({ location: farm.name, treeVarietal: tree.treeVariety.name, price: priceList[key], mintAddress: tree.mintAddress, mintIndex : tree.mintIndex });
      });
    })

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
