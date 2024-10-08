export async function register(
  walletAddress: string,
  name: string,
  roleId: number
) {
  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ walletAddress, name, roleId }),
    });
    if (!response.ok) {
      throw new Error("Failed to register user");
    }
    const result = await response.json();
    return result.user;
  } catch (error) {
    throw new Error("Error storing new user data");
  }
}
