"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/app/models/User";

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
