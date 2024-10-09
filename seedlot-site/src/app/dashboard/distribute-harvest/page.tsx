"use client"
import { useState } from "react";

export default function DistributeHarvestPage() {
    const [orderStatus, setOrderStatus] = useState("");

    const handleDistributeFunds = () => {

        // Investor = 50% 
        // Manager = 25%
        // Seedlot = 25%
        setOrderStatus("distributed");
    }

    return (
      <div className="space-y-12 px-8">
  
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Lot Harvests Ready For Distribution</h1>
      </div>
      
      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Order/Lots Number
                </th>
                <th scope="col" className="px-6 py-3">
                  Investor Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Manager Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <th
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  Toraja - #1024
                </th>
                <td className="px-6 py-4">Intuitive Global PTE</td>
                <td className="px-6 py-4">Ketut</td>
                <td className="px-6 py-4">
                {orderStatus &&
                    orderStatus == "undestributed" && (
                    <button
                        onClick={() => handleDistributeFunds()}
                        disabled
                        className="px-4 py-2 red text-white rounded hover:bg-blue-700"
                    >
                        Distribute Funds
                    </button>
                    )}
                    {orderStatus === "distributed" && (
                        <span className="px-2 py-1 text-xs font-semibold leading-tight text-green-700 bg-green-100 rounded-full">
                            Harvest Distributed
                        </span>
                    )}
              
                </td>
              </tr>              
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  }
  