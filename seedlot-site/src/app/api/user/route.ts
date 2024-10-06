import { NextRequest, NextResponse } from "next/server";
import { createUser, getAllUsers } from "../../models/User";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  try {
    const users = await getAllUsers(query || undefined);
    return new NextResponse(JSON.stringify({ users }), { status: 200 });
  } catch (error) {
    console.log("Custom Error fetching all users:", error);
    return new NextResponse(
      JSON.stringify({ error: `Error fetching all users` }),
      {
        status: 500,
      }
    );
  }
}

/**
 * Handles the POST request to create a new user.
 *
 * @param {Request} request - The incoming HTTP request object.
 * @returns {Promise<Response>} - A promise that resolves to an HTTP response.
 *
 * The function expects the request body to contain a JSON object with the following properties:
 * - `publicKey` (string): The public key of the user.
 * - `name` (string): The name of the user.
 * - `role` (string): The role of the user.
 *
 * If any of these properties are missing, the function returns a 400 status response with an error message.
 * If the user creation is successful, the function returns a 200 status response with the created user object.
 * If there is an error during user creation, the function logs the error and returns a 500 status response with an error message.
 */
export async function POST(request: NextRequest) {
  const { publicKey, name, roleId } = await request.json();

  console.log(publicKey, name, roleId);

  if (!publicKey || !name || !roleId) {
    return new Response(
      JSON.stringify({ error: "Public key, name and role are required" }),
      { status: 400 }
    );
  }

  try {
    const user = await createUser(publicKey, name, roleId);
    return new NextResponse(JSON.stringify({ user }), { status: 200 });
  } catch (error) {
    console.log("Custom Error creating user:", error);
    return new Response(JSON.stringify({ error: `Error creating user` }), {
      status: 500,
    });
  }
}
