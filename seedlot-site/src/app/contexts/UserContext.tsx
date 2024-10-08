"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User } from "@/app/models/User";
import { useWallet } from "@solana/wallet-adapter-react";
import { getUserByWalletAddress } from "../repository/user/getUser";

type UserContextType = {
  userDetails: User | null;
  setUserDetails: (user: User | null) => void;
  userDetailsNotFound: boolean;
  setUserDetailsNotFound: (notFound: boolean) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [userDetailsNotFound, setUserDetailsNotFound] = useState(false);
  const { publicKey } = useWallet();

  useEffect(() => {
    if (!publicKey) {
      setUserDetails(null);
      return
    }
    getUserByWalletAddress(publicKey.toString()).then((user) => {
      if (!user) {
        setUserDetailsNotFound(true);
      } else {
        setUserDetails(user);
      }
    });
  }, [publicKey]);

  return (
    <UserContext.Provider
      value={{
        userDetails,
        setUserDetails,
        userDetailsNotFound,
        setUserDetailsNotFound,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
