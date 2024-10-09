"use client";
import {
  LotAdditionalMetadata,
  useProgramContext,
} from "@/app/contexts/ProgramContext";
import usePayHarvest from "@/app/hooks/usePayHarvest";
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

type LotToDistribute = {
  location: string;
  variety: string;
  manager: string;
  index: number;
};

const OrderDiscributionRow = ({
  lotToDistribute,
}: {
  lotToDistribute: LotToDistribute;
}) => {
  const onlyClientPk = new PublicKey(
    "HWs7jPLCELEyqiRKQf3ykCJRr9jHhcrBgNqJUTY1kcU7"
  );
  const onlyAdminPk = new PublicKey(
    "7EH2PM64jX76tP2RVsDQDPBHYGFwfxeF74EbLSQcKC6e"
  );
  const manager = new PublicKey(lotToDistribute.manager);
  const payHarvest = usePayHarvest();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [costOfHarvest, setCostOfHarvest] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);

  const handleDistributeFunds = async () => {
    setLoading(true);
    if (typeof costOfHarvest !== "number" || typeof profitAmount !== "number") {
      throw new Error("Invalid input");
    }
    if (!payHarvest) {
      throw new Error("Pay harvest not found");
    }
    console.log({
      payHarvestArgs: {
        manager,
        user: onlyClientPk,
        admin: onlyAdminPk,
        lotIndex: lotToDistribute.index,
        costOfHarvest,
        profit: profitAmount,
      },
    });
    await payHarvest({
      manager,
      user: onlyClientPk,
      admin: onlyAdminPk,
      lotIndex: lotToDistribute.index,
      costOfHarvest,
      profit: profitAmount,
    });
    setDone(true);
  };
  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
      <th
        scope="row"
        className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
      >
        {lotToDistribute.location}
      </th>
      <td className="px-6 py-4">{lotToDistribute.variety}</td>
      <td className="px-6 py-4">{lotToDistribute.manager}</td>
      <td className="px-6 py-4">
        <input
          type="number"
          min="100"
          className="w-24 px-2 py-1 mr-2 text-gray-700 border rounded"
          name="costOfHarvest"
          value={costOfHarvest}
          onChange={(e) => setCostOfHarvest(Number(e.target.value))}
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="number"
          min="100"
          className="w-24 px-2 py-1 mr-2 text-gray-700 border rounded"
          name="profitAmount"
          value={profitAmount}
          onChange={(e) => setProfitAmount(Number(e.target.value))}
        />
      </td>
      <td className="px-6 py-4">
        {done ? (
          <p>Done</p>
        ) : (
          <button
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={handleDistributeFunds}
          >
            Distribute
          </button>
        )}
      </td>
    </tr>
  );
};

export default function DistributeHarvestPage() {
  const { program, lots, contract } = useProgramContext();
  console.log({ usdcMint: contract?.usdcMint.toBase58() });
  const [lotsToDistribute, setLotsToDistribute] = useState<LotToDistribute[]>(
    []
  );
  useEffect(() => {
    if (!program) return;
    const getLotsToConfirm = async () => {
      const lotsToMaybeConfirmPromise = lots?.lots
        .slice(0, lots.tail.toNumber())
        .map(async (lot, i) => {
          const lotMetadata = await getTokenMetadata(
            program.provider.connection,
            lot.mint,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          if (!lotMetadata) return undefined;
          const lotAdditionalMetadata = Object.fromEntries(
            lotMetadata.additionalMetadata
          ) as LotAdditionalMetadata;
          if (lotAdditionalMetadata.state == "0") return undefined;
          return {
            location: lotAdditionalMetadata.location,
            variety: lotAdditionalMetadata.variety,
            manager: lotAdditionalMetadata.manager,
            index: i,
          } as LotToDistribute;
        });
      if (!lotsToMaybeConfirmPromise) return;
      const lotsToMaybeConfirm = await Promise.all(lotsToMaybeConfirmPromise);
      setLotsToDistribute(
        lotsToMaybeConfirm.filter((lot) => lot !== undefined)
      );
    };
    getLotsToConfirm();
  }, [lots, program]);

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">
          Lot Harvests Ready For Distribution
        </h1>
      </div>

      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Location
                </th>
                <th scope="col" className="px-6 py-3">
                  Variety
                </th>
                <th scope="col" className="px-6 py-3">
                  Manager
                </th>
                <th scope="col" className="px-6 py-3">
                  Amount for Harvesting (Cents)
                </th>
                <th scope="col" className="px-6 py-3">
                  Profit Amount (Cents)
                </th>
                <th scope="col" className="px-6 py-3">
                  Distribute
                </th>
              </tr>
            </thead>
            <tbody>
              {lotsToDistribute.map((lotToDistribute) => (
                <OrderDiscributionRow
                  lotToDistribute={lotToDistribute}
                  key={lotToDistribute.index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
