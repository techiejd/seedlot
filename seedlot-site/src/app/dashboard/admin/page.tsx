"use client";
import React from "react";
import { useProgramContext } from "@/app/contexts/ProgramContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserContext } from "@/app/contexts/UserContext";
import useAddOffer from "@/app/hooks/useAddOffer";


const AdminDashboard: React.FC = () => {
  const { userDetails } = useUserContext();
  const { publicKey } = useWallet();
  const programContext = useProgramContext();
  const addOffer = useAddOffer();

  const handleInitializeProgram = async () => {
    console.log("Initializing Program");
    if (programContext && publicKey && programContext.useInitialize) {
      console.log(await programContext.useInitialize());
    }
  };

  const handleAddLotOffers = async () => {
    console.log("Creating Lot Offers");
    const response = await fetch('/api/farms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const farms = await response.json();
    console.log(farms);
    // addOffer({}).then((res) => {
    //   console.log(res);
    // });
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
      <div className="pl-8">
        <h1 className="text-2xl mb-4 font-bold">Admin Dashboard</h1>
        <button
          onClick={handleInitializeProgram}
          className="bg-purple-700 text-white rounded-lg px-4 py-2 border-none cursor-pointer"
        >
          Initialize Program
        </button>
      </div>
      <hr className="mt-8" />
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Add Lot Offers</h2>
        <div className="mt-4">
        <button
          onClick={handleAddLotOffers}
          className="bg-blue-700 text-white rounded-lg px-4 py-2 border-none cursor-pointer"
        >
          Create
        </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
