import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";



// Custom hook to manage user details
export const useUserDetails = () => {
  const [userDetails, setUserDetails] = useState(null); // User details state
  const [registrationRequired, setRegistrationRequired] = useState(false); // User details state
  const { publicKey, connected } = useWallet();

  const fetchUserDetails = async () => {
    try {
        const response = await fetch(`/api/user/${publicKey?.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const result = await response.json();
      setUserDetails(result.user);
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw new Error("Unable to fetch user data");
    }
  };


  useEffect(() => {
    if(!connected) {
        setUserDetails(null);
        return
    }
    if(publicKey && connected && !userDetails) {
        fetchUserDetails();
        setRegistrationRequired
    }
  }, [connected]);

  
  return {
    userDetails,
    registrationRequired
  };
};
