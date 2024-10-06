import { NextRequest, NextResponse } from "next/server";
import { getUserByWalletAddress } from "../../../models/User";

/**
 * Handles GET requests to fetch user data based on a public key.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {Promise<NextResponse>} - The response containing user data or an error message.
 *
 * The function performs the following steps:
 * 1. Extracts the `publicKey` from the request's URL search parameters.
 * 2. If `publicKey` is not provided, returns a 400 response with an error message.
 * 3. Attempts to fetch user data using the `getUserByWalletAddress` function.
 * 4. If successful, returns a 200 response with the user data.
 * 5. If an error occurs during data fetching, logs the error and returns a 500 response with an error message.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  const { walletAddress } = params;

  if (!walletAddress) {
    return new NextResponse(
      JSON.stringify({ error: "Wallet Address is required" }),
      { status: 400 }
    );
  }

  try {
    const user = await getUserByWalletAddress(walletAddress);
    return new NextResponse(JSON.stringify({ user }), { status: 200 });
  } catch (error) {
    console.log("Custom Error fetching user data:", error);
    return new NextResponse(
      JSON.stringify({ error: `Error fetching user data` }),
      {
        status: 500,
      }
    );
  }
}
