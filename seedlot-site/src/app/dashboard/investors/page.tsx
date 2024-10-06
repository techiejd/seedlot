import React from "react";
import { getUsersByRole } from "./../../repository/user/getUsers";

interface Investor {
  name: string;
  walletAddress: string;
  lots: { length: number }[];
}

export default async function ClientsPage() {
  const investors = await getUsersByRole("investor");

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Investors List</h1>
      </div>

      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Investor Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Wallet Address
                </th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor: Investor) => (
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {investor.name}
                  </th>
                  <td className="px-6 py-4">{investor.walletAddress}</td>
                  <td className="px-6 py-4">{investor.lots.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
