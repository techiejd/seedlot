import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { WalletProvider } from "./walletProvider";
import Nav from "@/app/components/Nav";
import Link from "next/link";
import { ProgramProvider } from "./contexts/ProgramContext";
import { UserProvider } from "./contexts/UserContext";
import getContractPK from "./models/Contract";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contract = await getContractPK();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <UserProvider>
            <ProgramProvider contractPK={contract?.contractPK}>{children}</ProgramProvider>
          </UserProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
