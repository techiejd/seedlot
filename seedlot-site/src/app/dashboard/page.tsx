import React from "react";

interface DashboardProps {
  children?: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">The Seedlot Control Center </h1>
    </div>
  );
}
