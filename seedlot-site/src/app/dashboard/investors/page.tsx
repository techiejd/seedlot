"use client";
import React, { useState, useMemo, useEffect } from "react";
import { getUsersByRole } from "./../../repository/user/getUsers";

interface Investor {
  name: string;
  walletAddress: string;
  lots: { length: number }[];
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);

  useEffect(() => {
    async function fetchInvestors() {
      const data = await getUsersByRole("investor");
      setInvestors(data);
    }

    fetchInvestors();
  }, []);


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
                <th scope="col" className="px-6 py-3">
                  Number Of Orders
                </th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor: Investor) => (
                <tr key={investor.walletAddress} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-6 py-4">{investor.name}</td>
                  <td className="px-6 py-4">{investor.walletAddress}</td>
                  <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    xx
                  </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
