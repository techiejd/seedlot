"use client";
import React, { useState, useMemo, useEffect } from "react";
import { getUsersByRole } from "./../../repository/user/getUsers";

interface Manager {
  name: string;
  walletAddress: string;
  lots: { length: number }[];
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);

  useEffect(() => {
    async function fetchManagers() {
      const data = await getUsersByRole("manager");
      setManagers(data);
    }

    fetchManagers();
  }, []);

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Farm Managers List</h1>
      </div>

      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Manager Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Wallet Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Certified
                </th>
              </tr>
            </thead>
            <tbody>
              {managers.map((investor: Manager) => (
                <tr key={investor.walletAddress} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td
                  scope="row"
                  className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                  {investor.name}
                  </td>
                  <td className="px-6 py-4">{investor.walletAddress}</td>
                  <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Not Certified
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
