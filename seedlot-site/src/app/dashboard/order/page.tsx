"use client";
import React, { useState } from "react";
import usePlaceOrder, { Order } from "@/app/hooks/usePlaceOrder"; // assuming the hook is saved here
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

const treesPerLot = 100;
const baseCostPerTree = 10;
const baseReturnPerTreePerYear = 3.5;

type TreeType = "SL795" | "Catuai" | "Typica" | "Liberica";

interface Tree {
  type: TreeType;
  costPerLot: number;
  annualReturnPerLot: number;
  cultivationPeriod: number;
}
interface Location {
  lat: number;
  long: number;
  lotsPerOrder: number;
  trees: Array<Tree>;
  description: string;
  image: string;
}

interface Offer {
  location: string,
  treeVarietal: string,
  price: number,
  mintAddress: string
}

const lotInfo: {
  [key in "toraja" | "kintamani" | "sarawak"]: Array<Location>;
} = {
  toraja: [
    {
      lat: -3.0457,
      long: 119.8222,
      lotsPerOrder: 1000,
      trees: [
        {
          type: "SL795",
          costPerLot: baseCostPerTree * 1.1 * treesPerLot,
          annualReturnPerLot: baseReturnPerTreePerYear * 1.1 * treesPerLot,
          cultivationPeriod: 3,
        },
        {
          type: "Typica",
          costPerLot: baseCostPerTree * 1.3 * treesPerLot,
          annualReturnPerLot: baseReturnPerTreePerYear * 1.3 * treesPerLot,
          cultivationPeriod: 4,
        },
        {
          type: "Catuai",
          costPerLot: baseCostPerTree * 1.1 * treesPerLot,
          annualReturnPerLot: baseReturnPerTreePerYear * 1.1 * treesPerLot,
          cultivationPeriod: 3,
        },
      ],
      description: "Toraja, Sulawesi, Indonesia [1800m arabica]",
      image: "toraja.jpg",
    },
  ],
  kintamani: [
    {
      lat: -8.3256,
      long: 115.3126,
      lotsPerOrder: 100,
      trees: [
        {
          type: "Catuai",
          costPerLot: baseCostPerTree * treesPerLot,
          annualReturnPerLot: baseReturnPerTreePerYear * treesPerLot,
          cultivationPeriod: 3,
        },
      ],
      description: "Kintamani, Bali, Indonesia [1200m arabica]",
      image: "kintamani.jpg",
    },
  ],
  sarawak: [
    {
      lat: 1.5533,
      long: 110.3592,
      lotsPerOrder: 500,
      trees: [
        {
          type: "Liberica",
          costPerLot: baseCostPerTree * 0.8 * treesPerLot,
          annualReturnPerLot: baseReturnPerTreePerYear * 0.8 * treesPerLot,
          cultivationPeriod: 3,
        },
      ],
      description: "Sarawak, Malaysia [1000m liberica]",
      image: "sarawak.jpg",
    },
  ],
};

export default function OrderPage() {
  // States
  const [selectedFarm, setSelectedFarm] = useState<
    "toraja" | "kintamani" | "sarawak"
  >("toraja");
  const [maxLots, setMaxLots] = useState(lotInfo[selectedFarm][0].lotsPerOrder);
  const [selectedTreeType, setSelectedTreeType] = useState<TreeType>("Catuai");

  // Calculated Vars as States
  const [totalCost, setTotalCost] = useState(0);
  const [numberOfLotsToPurchase, setNumberOfLotsToPurchase] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [cultivationPeriod, setCultivationPeriod] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(0);
  const [roi, setRoi] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const placeOrder = usePlaceOrder();

  // Handlers
  const handleFarmChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFarm = event.target.value as "toraja" | "kintamani" | "sarawak";
    setSelectedFarm(newFarm);
    setMaxLots(lotInfo[newFarm][0].lotsPerOrder);
  };



  const handlePlaceOrder = async () => {
    if (!wallet.connected) {
      setError("Wallet is not connected.");
      return;
    }

    setLoading(true);
    setError(null);
    try {

      const response = await fetch('/api/offers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const res = await response.json();
      console.log('response',res.offers);

      const offers = res.offers;
      const selectedOffer = offers.find(
        (offer: Offer) =>
          offer.treeVarietal.toLowerCase() === selectedTreeType.toLowerCase() &&
          offer.location.toLowerCase() === selectedFarm.toLowerCase()
      );

      if (!selectedOffer) {
        throw new Error("No matching offer found.");
      }

      console.log("Selected Offer:", selectedOffer);
      const order = placeOrder({
        mintIndexInOffers: selectedOffer.mintIndex,
        mint: selectedOffer.mintAddress,
        amount: numberOfLotsToPurchase,
      })

      alert("Order placed successfully!");
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const handleTreeTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedTreeType(event.target.value as TreeType);
  };

  const calculateReturns = () => {
    console.log("Calculating Returns");
    const selectedFarmData = lotInfo[selectedFarm][0];
    const selectedTreeData = selectedFarmData.trees.find(
      (tree) => tree.type === selectedTreeType
    );

    console.log("selected tree data", selectedTreeData);
    if (!selectedTreeData) {
      return;
    }

    console.log("selected tree data", selectedTreeData);
    console.log("numberOfLotsToPurchase", numberOfLotsToPurchase);
    console.log("cultivationPeriod", selectedTreeData.cultivationPeriod);

    setTotalCost(selectedTreeData.costPerLot * numberOfLotsToPurchase);
    setTotalReturn(
      selectedTreeData.annualReturnPerLot *
        numberOfLotsToPurchase *
        (25 - selectedTreeData.cultivationPeriod)
    );
    setAnnualReturn(
      selectedTreeData.annualReturnPerLot * numberOfLotsToPurchase
    );
    setRoi(
      (selectedTreeData.annualReturnPerLot / selectedTreeData.costPerLot) * 100
    );
    setCultivationPeriod(selectedTreeData.cultivationPeriod);
  };

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Calculate Potential Returns</h1>
      </div>

      <div className="flex">
        <div className="mt-10 flex flex-col w-1/2 border-r-solid border-r-2 border-r-grey-500 mr-4">
          <div className="sm:col-span-4">
            <label className="block text-sm font-medium leading-6 text-gray-900">
              Which farm would you like to purchase lots from:
            </label>

            <select
              className="p-2 border rounded"
              value={selectedFarm}
              onChange={handleFarmChange}
            >
              <option value="toraja">
                Toraja, Sulawesi, Indonesia [1800m arabica]
              </option>
              <option value="kintamani">
                Kintamani, Bali, Indonesia [1200m arabica]
              </option>
              <option value="sarawak">
                Sarawak, Malaysia [1000m liberica]
              </option>
            </select>
          </div>

          <div className="col-span-full mt-6">
            <label
              htmlFor="about"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Which tree type would you like to purchase:
            </label>
            {selectedFarm && (
              <select
                className="p-2 border rounded"
                value={selectedTreeType}
                onChange={handleTreeTypeChange}
              >
                {lotInfo[selectedFarm][0].trees.map((tree) => (
                  <option key={tree.type} value={tree.type}>
                    {tree.type}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="col-span-full mt-6">
            <label
              htmlFor="about"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              How Many Lots would you like to purchase
            </label>
            {selectedFarm && (
              <input
                type="number"
                className="p-2 border rounded"
                max={maxLots}
                value={numberOfLotsToPurchase}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value <= maxLots) {
                    setNumberOfLotsToPurchase(value);
                  } else {
                    setNumberOfLotsToPurchase(maxLots); // Optionally, set to maxLots if value exceeds max
                  }
                }}
              />
            )}
            <p className="mt-3 text-sm leading-6 text-gray-600">
              You can purchase up to {maxLots} lots at one time from this Farm
            </p>
          </div>

          <div className="mt-6 flex items-right justify-right ">
            <button
              onClick={calculateReturns}
              className=" rounded-md bg-green-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Calculate
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col w-1/2 overflow-hidden">
          <table className="table-auto w-full mt-12">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Total Cost</th>
                <th className="px-4 py-2 text-left">Total Return</th>
                <th className="px-4 py-2 text-left">Cultivation Period</th>
                <th className="px-4 py-2 text-left">Annual Return</th>
                <th className="px-4 py-2 text-left">ROI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-left">
                  ${totalCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </td>
                <td className="px-4 py-2 text-left">
                  $
                  {totalReturn.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                </td>
                <td className="px-4 py-2 text-left">
                  {cultivationPeriod.toFixed(0)} years
                </td>
                <td className="px-4 py-2 text-left">
                  $
                  {annualReturn
                    .toFixed(0)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                  PA <br /><small>(after first harvest)</small>
                </td>
                <td className="px-4 py-2 text-left">
                  {roi.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}% <br /><small>(after first harvest)</small>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 flex items-right justify-right ">
            <button
              onClick={handlePlaceOrder}
              className=" rounded-md bg-green-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
