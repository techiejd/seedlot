"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  {
    loading: () => <p>loading...</p>,
  }
);

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Seedlot</h1>
      <WalletMultiButton className="mb-8" />
      <nav className="mb-8">
        <ul className="flex space-x-4">
          <li>
            <Link href="/admin" className="text-blue-500 hover:underline">
              Admin
            </Link>
          </li>
          <li>
            <Link href="/manager" className="text-blue-500 hover:underline">
              Manager
            </Link>
          </li>
          <li>
            <Link href="/user" className="text-blue-500 hover:underline">
              User
            </Link>
          </li>
        </ul>
      </nav>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Solana Contracts</h2>
        <ul>
          <li>
            <strong>Seedlot Contracts:</strong>{" "}
            2HTz6TXN6ERPGS3d5ZpYMjjR6bgpyTh1LjaXB543vEmp
          </li>
        </ul>
      </div>
    </div>
  );
}
