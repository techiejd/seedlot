"use client";
import React, { useCallback } from "react";
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
  console.log(programContext);
  const handleAddLotOffers = useCallback(async () => {
    console.log("Creating Lot Offers");
    const response = await fetch("/api/offers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const res = await response.json();
    console.log(res.offers);

    console.log(
      await addOffer({
        location: res.offers[2].location.toLowerCase(),
        variety: res.offers[2].treeVarietal.toLowerCase(),
        price: res.offers[2].price,
      })
    );
    // offer1: QHNLqTUczTqRnqrK31KsoFSHxthdL5stc1Zx85PGsU8xrcDYiTEKJ3PXrwgczqfe3GeBH3PXNbdq3DKx5zMKJa1
    // offer2: 67UD5SgbpsbhWXpp6RCVox977iBX7MbD5qP6MsDKvyPrXna7Apaj5QtoZF5Sap2ZNRACJrr2U515xahh1LUbcJsS

    // res.offers.forEach(async (offer: { location: string; treeVarietal: string; price:number } ) => {
    //   console.log("ready to add offers");
    //   console.log(offer);

    //   //  this should run
    //   // console.log(await addOffer({ location: offer.location.toLowerCase(), variety: offer.treeVarietal.toLowerCase(), price: offer.price }));
    // });
  }, [addOffer]);

  if (!userDetails) {
    return <div>Loading...</div>;
  }
  console.log(userDetails);
  if (userDetails.role.name !== "admin") {
    return <div>Restricted Page</div>;
  }
  return (
    <div className="pl-8">
      <div>
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
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
