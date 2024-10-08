"use client";
import Link from "next/link";
import { WalletAuth } from "./components/WalletAuth/WalletAuth";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserContext } from "@/app/contexts/UserContext";
import Image from "next/image";
import { RegisterModal } from "./components/Auth/RegisterModal";


export default function Home() {
  const { publicKey } = useWallet();
  const { userDetails, userDetailsNotFound } = useUserContext();

  return (
    <div className="flex min-h-screen">
      {userDetailsNotFound && publicKey && (
        <RegisterModal walletAddress={publicKey.toString()}  />
      )}
      <div className="flex flex-col items-center justify-center w-1/2 bg-gray-100">
        <Image
          src="/images/seedlot_logo_black.png"
          alt="Seedlot"
          width={200}
          height={80}
          className="mb-8"
        />
        {userDetails && (
          <Link href="/dashboard">
            <span className="relative inline-flex transition-opacity duration-300 ease-in">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-green-900 transition ease-in-out duration-150 ring-1 ring-slate-900/10"
              >
                Dashboard
              </button>
              <span className="flex absolute h-3 w-3 top-0 right-0 -mt-1 -mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            </span>
          </Link>
        )}
      </div>
      <div className="flex flex-col items-center justify-center w-1/2">
        <h2 className="text-2xl font-semibold mb-4">
          Connect Your Wallet to get started
        </h2>

        <WalletAuth />

        {/* <div className="items-bottom">
          <h5 className="text-md font-semibold mb-4">Solana Contracts</h5>
          <ul>
            <li>
              <strong>Seedlot Contracts:</strong>{" "}
              Bj5esFf6t1g1nRRw2n12NDuad4fxFoXRavFnC1daX2Zk
            </li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}