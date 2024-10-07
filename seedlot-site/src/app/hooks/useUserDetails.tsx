import { useState, useEffect, useMemo } from "react";
import { useUserContext } from "@/app/contexts/UserContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { getUserByWalletAddress } from "@/app/repository/user/getUser";

// Custom hook to manage user details
export const useUserDetails = () => {
  const { publicKey, connected } = useWallet();
  const {
    userDetails,
    setUserDetails,
    userDetailsNotFound,
    setUserDetailsNotFound,
  } = useUserContext();

  useMemo(() => {
    if (!publicKey) {
      setUserDetails(null);
      return;
    }
    getUserByWalletAddress(publicKey.toString()).then((user) => {
      if (!user) {
        setUserDetailsNotFound(true);
      } else {
        setUserDetails(user);
      }
    });
  }, [connected]);

  return {
    userDetails,
    setUserDetails,
    userDetailsNotFound,
    setUserDetailsNotFound,
  };
};
