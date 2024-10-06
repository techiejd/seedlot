import type { Metadata } from "next";
import localFont from "next/font/local";
import "./../globals.css";
import { WalletProvider } from "./../walletProvider";
import SideNav from "@/app/components/Dashboard/SideNav";

const geistSans = localFont({
  src: "./../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Seedlot",
  description:
    "From Soil to Sip: Take Part in The Coffee Supply Chain with tree investments recorded on the blockchain",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SideNav />
      <div className="grow mt-10">{children}</div>
    </div>
  );
}
