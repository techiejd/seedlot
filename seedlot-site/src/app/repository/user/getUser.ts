export async function getUserByWalletAddress(walletAddress: string) {
  try {
    const response = await fetch(`/api/user/${walletAddress}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const result = await response.json();
    return result.user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Unable to fetch user data");
  }
}
