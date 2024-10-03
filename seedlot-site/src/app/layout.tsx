import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { WalletProvider } from "./walletProvider";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import SideNav from "@/components/SideNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Seedlot",
  description:
    "From Soil to Sip: Take Part in The Coffee Supply Chain with tree investments recorded on the blockchain",
};



const searchParams = useSearchParams();
const role = searchParams.get("role") || "defaultRole";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SideNav role={role} />
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
