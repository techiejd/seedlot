import { NextRequest, NextResponse } from "next/server";
import { getAllFarms } from "../../models/AvailableFarm";

interface Offer {
  location: string,
  treeVarietal: string,
  price: number,
  mintAddress: string | null
}

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
        offers.push({ location: farm.name, treeVarietal: tree.treeVariety.name, price: priceList[key], mintAddress: tree.mintAddress});
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
