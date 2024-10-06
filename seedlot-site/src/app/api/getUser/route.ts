import { doc, getDoc } from "firebase/firestore";
import { db } from "./../../../config/firebaseConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get("publicKey");

  if (!publicKey) {
    return new NextResponse(
      JSON.stringify({ error: "Public key is required" }),
      { status: 400 }
    );
  }
 console.log('publicKey:', publicKey);
  try {
    // Check if the user exists in the database
    const userDocRef = doc(db, "users", publicKey);
    const userDoc = await getDoc(userDocRef);
    const user = userDoc.data();
    if (!userDoc.exists()) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    return new NextResponse(JSON.stringify({ user }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Error fetching user data" }),
      { status: 500 }
    );
  }
}
