import { NextRequest, NextResponse } from "next/server";
import { getAllFarms } from "../../models/AvailableFarm";
import { stringify } from "querystring";

interface Offer {
  location: string,
  treeVarietal: string,
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {
    const farms = await getAllFarms();
    const offers: Offer[] = [];
 
    farms.map((farm) => {
      farm.TreesAtFarm.map((tree) => {
        offers.push({ location: farm.name, treeVarietal: tree.treeVariety.name });
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