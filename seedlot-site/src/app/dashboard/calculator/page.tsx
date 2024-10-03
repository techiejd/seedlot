"use client";
import React, { useState } from "react";

const treesPerLot = 100;
const baseCostPerTree = 15;

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
          annualReturnPerLot: 50,
          cultivationPeriod: 3,
        },
        {
          type: "Typica",
          costPerLot: baseCostPerTree * 1.3 * treesPerLot,
          annualReturnPerLot: 70,
          cultivationPeriod: 4,
        },
        {
          type: "Catuai",
          costPerLot: baseCostPerTree * 1.1 * treesPerLot,
          annualReturnPerLot: 50,
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
          annualReturnPerLot: 50,
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
          annualReturnPerLot: 40,
          cultivationPeriod: 3,
        },
      ],
      description: "Sarawak, Malaysia [1000m liberica]",
      image: "sarawak.jpg",
    },
  ],
};

export default function CalculatorPage() {
  // States
  const [selectedFarm, setSelectedFarm] = useState<
   "toraja" | "kintamani" | "sarawak"
  >("toraja");
  const [maxLots, setMaxLots] = useState(lotInfo[selectedFarm][0].lotsPerOrder);
  const [selectedTreeType, setSelectedTreeType] = useState<TreeType>("Catuai");

  // Calculated Vars as States
  const [totalCost, setTotalCost] = useState(0);
  const [totalReturn, setTotalReturn] = useState(0);
  const [cultivationPeriod, setCultivationPeriod] = useState(0);
  const [annualReturn, setAnnualReturn] = useState(0);
  const [roi, setRoi] = useState(0);

  // Handlers
  const handleFarmChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFarm = event.target.value as "toraja" | "kintamani" | "sarawak";
    setSelectedFarm(newFarm);
    setMaxLots(lotInfo[newFarm][0].lotsPerOrder);
  };

  const handleTreeTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedTreeType(
      event.target.value as TreeType
    );
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

    console.log("selectedTreeData.costPerLot", selectedTreeData.costPerLot);
    setTotalCost(selectedTreeData.costPerLot);
    setTotalReturn(selectedTreeData.annualReturnPerLot);
    setCultivationPeriod(selectedTreeData.cultivationPeriod);
    setAnnualReturn(selectedTreeData.annualReturnPerLot / selectedTreeData.cultivationPeriod);
    setRoi((selectedTreeData.annualReturnPerLot / selectedTreeData.cultivationPeriod / selectedTreeData.costPerLot) * 100);
  };

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Calculate Your Returns</h1>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-4">
          <label className="block text-sm font-medium leading-6 text-gray-900">
            Which farm would you like to purchase lots from:
          </label>

          <div className="mt-2">
            <select
              className="ml-2 p-2 border rounded"
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
          <p className="mt-3 text-sm leading-6 text-gray-600">
            You can purchase up to {maxLots} lots at one time from this Farm
          </p>
        </div>

        <div className="col-span-full">
          <label
            htmlFor="about"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Which tree type would you like to purchase:
          </label>
          {selectedFarm && (
            <select
              className="ml-2 p-2 border rounded"
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

        <div className="mt-6 flex items-center gap-x-6">
          <button
            onClick={calculateReturns}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Calculate
          </button>
        </div>
      </div>

      <table className="table-auto w-full mt-12">
        <thead>
          <tr>
            <th className="px-4 py-2">Total Cost</th>
            <th className="px-4 py-2">Total Return</th>
            <th className="px-4 py-2">Cultivation Period</th>
            <th className="px-4 py-2">Annual Return</th>
            <th className="px-4 py-2">ROI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2">{totalCost}</td>
            <td className="px-4 py-2">{totalReturn}</td>
            <td className="px-4 py-2">{cultivationPeriod}</td>
            <td className="px-4 py-2">{annualReturn}</td>
            <td className="px-4 py-2">{roi}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
