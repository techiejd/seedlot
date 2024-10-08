"use client";
import React from "react";
import { useProgramContext } from "@/app/contexts/ProgramContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserContext } from "@/app/contexts/UserContext";

const AdminDashboard: React.FC = () => {
  const { userDetails } = useUserContext();
  const { publicKey } = useWallet();
  const programContext = useProgramContext();

  const handleInitializeProgram = async () => {
    console.log("Initializing Program");
    if (programContext && publicKey && programContext.useInitialize) {
      console.log(await programContext.useInitialize());
    }
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }
  console.log(userDetails);
  if (userDetails.role.name !== "admin") {
    return <div>Restricted Page</div>;
  }
  return (
    <div className="pl-8">
      <h1 className="text-2xl mb-4 font-bold">Admin Dashboard</h1>
      <button
        onClick={handleInitializeProgram}
        className="bg-purple-700 text-white rounded-lg px-4 py-2 border-none cursor-pointer"
      >
        Initialize Program
      </button>
    </div>
  );
};

export default AdminDashboard;
