import { verify } from "crypto";
import { useState } from "react";

export default function OrdersAvailablePage() {
    const [orderStatus, setOrderStatus] = useState("");

    const handleVerifyOrderPlanted = async () => {
        setOrderStatus("verified");
    }
    const handleFulfillOrder = async () => {
        setOrderStatus("fulfilled");
    }

    return (
      <div className="space-y-12 px-8">
  
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Orders Ready To Be Fulfilled</h1>
      </div>
      
      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Farm
                </th>
                <th scope="col" className="px-6 py-3">
                  Investor
                </th>
                <th scope="col" className="px-6 py-3">
                  Lots
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
                  Toraja
                </th>
                <td className="px-6 py-4">Intuitive Global PTE</td>
                <td className="px-6 py-4">10</td>
                <td className="px-6 py-4">
                {orderStatus &&
                    orderStatus == "unverified" && (
                    <button
                        onClick={() => handleVerifyOrderPlanted()}
                        disabled
                        className="px-4 py-2 red text-white rounded hover:bg-blue-700"
                    >
                        Verify Order
                    </button>
                    )}
                {orderStatus &&
                    orderStatus == "verified" && (
                    <button
                        onClick={() => handleFulfillOrder()}
                        disabled
                        className="px-4 py-2 red text-white rounded hover:bg-blue-700"
                    >
                        Fulfill Order
                    </button>
                    )}
                    {orderStatus &&
                    orderStatus == "fulfilled" && (
                        <span>Order Fulfilled to: {"xyz"}</span>
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
  