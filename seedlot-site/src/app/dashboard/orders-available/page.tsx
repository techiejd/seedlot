"use client";
import { useProgramContext } from "@/app/contexts/ProgramContext";
import { getClientOrderAta } from "@/app/hooks/useAta";
import usePrepareLots from "@/app/hooks/usePrepareLots";
import { getTokenMetadata } from "@solana/spl-token";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useState, useEffect } from "react";

export default function OrdersPage() {
  const { program } = useProgramContext();
  const { offers } = useProgramContext();
  const torajaCatuiMintIdx = 2;
  const torajaCatui = offers?.offers[torajaCatuiMintIdx];
  const onlyClientPk = "HWs7jPLCELEyqiRKQf3ykCJRr9jHhcrBgNqJUTY1kcU7";
  const clientOrderAta = !torajaCatui
    ? undefined
    : getClientOrderAta(
        new PublicKey(onlyClientPk),
        new PublicKey(torajaCatui.mint)
      );
  console.log({ clientOrderATA: clientOrderAta });
  const [numOpenOrders, setNumOpenOrders] = useState(0);
  const [price, setPrice] = useState(0);
  useEffect(() => {
    if (!clientOrderAta) return;
    const getOpenOrders = async () => {
      const balance = await program?.provider.connection.getTokenAccountBalance(
        clientOrderAta
      );
      if (balance) {
        setNumOpenOrders(balance.value.uiAmount ?? 0);
      }
    };
    getOpenOrders();
  }, [clientOrderAta, program?.provider.connection]);
  useEffect(() => {
    if (!torajaCatui || !program?.provider.connection) return;
    const getPrice = async () => {
      const metadata = await getTokenMetadata(
        program?.provider.connection,
        new PublicKey(torajaCatui.mint)
      );
      if (metadata) {
        const a = metadata.additionalMetadata;
        setPrice(Number(a.filter((m) => m[0] === "price")[0][1]) / 100);
      }
    };
    getPrice();
  }, [torajaCatui, program?.provider.connection]);
  const [loading, setLoading] = useState(false);
  const prepareLots = usePrepareLots();
  const wallet = useAnchorWallet();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const quantity = formData.get("quantity");
    console.log({ quantity });
    if (!torajaCatui) throw new Error("Toraja Catui not found");
    if (!wallet) throw new Error("Wallet not found");
    setLoading(true);
    console.log({
      prepareLotsParams: {
        orderMintIndex: torajaCatuiMintIdx,
        numLotsToPrepare: Number(quantity),
        orderMint: new PublicKey(torajaCatui.mint),
        user: new PublicKey(onlyClientPk), // TODO(techiejd): Really should change all 'user' to 'client'
      },
    });
    await prepareLots({
      orderMintIndex: torajaCatuiMintIdx,
      numLotsToPrepare: Number(quantity),
      orderMint: new PublicKey(torajaCatui.mint),
      user: new PublicKey(onlyClientPk), // TODO(techiejd): Really should change all 'user' to 'client'
    });
    setLoading(false);
  };
  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">All Orders</h1>
      </div>

      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Lot Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Varietal
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Lot Quantity
                </th>
                <th scope="col" className="px-6 py-3">
                  Total Amount (USDT)
                </th>
                <th scope="col" className="px-6 py-3">
                  Prepare?
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-6 py-4">Toraja</td>
                <td className="px-6 py-4">Catuai</td>
                <td className="px-6 py-4">Pending</td>
                <td className="px-6 py-4">{numOpenOrders}</td>
                <td className="px-6 py-4">
                  {(numOpenOrders * price).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td className="px-6 py-4">
                  <form onSubmit={handleSubmit}>
                    <input
                      type="number"
                      min="1"
                      max={numOpenOrders}
                      defaultValue="1"
                      className="w-16 px-2 py-1 mr-2 text-gray-700 border rounded"
                      name="quantity"
                    />
                    <button
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                      type="submit"
                    >
                      Prepare
                    </button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
