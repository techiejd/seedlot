"use client";
import React from "react";
import { useUserDetails } from "../hooks/useUserDetails";
interface DashboardProps {
  children?: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const { userDetails } = useUserDetails();
  if (!userDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">The Seedlot Dashboard </h1>
      <span className="inline-block bg-blue-200 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full">
        What can I do here?
      </span>
      <ul className="list-disc list-inside mt-4 space-y-2">
        <li className="text-lg">Manage your Lots</li>
        <li className="text-lg">Apply for certification</li>
        <li className="text-lg">Manage your managers</li>
        <li className="text-lg">Manage your clients</li>
      </ul>
    </div>
  );
}
