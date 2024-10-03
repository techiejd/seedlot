import React from "react";

interface DashboardProps {
  children?: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div>
      <div>Dashboard</div>
    </div>
  );
}
