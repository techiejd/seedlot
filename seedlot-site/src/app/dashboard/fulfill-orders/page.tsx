"use client";
import {
  LotAdditionalMetadata,
  TREES_PER_LOT,
  useProgramContext,
} from "@/app/contexts/ProgramContext";
import useConfirmLots from "@/app/hooks/useConfirmLots";
import { BN } from "@coral-xyz/anchor";
import {
  getMint,
  getTokenMetadata,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { Fragment, useEffect, useState } from "react";

type LotToConfirm = {
  numberOfLots: number;
  totalPricePledgedPerLot: number;
  manager: string;
  location: string;
  variety: string;
  key: string;
  orderIndex: number;
  lotIndex: number;
};

const OrderConfirmationRow = ({
  lotToConfirm,
}: {
  lotToConfirm: LotToConfirm;
}) => {
  const confirmLots = useConfirmLots();
  const onlyClientPk = new PublicKey(
    "HWs7jPLCELEyqiRKQf3ykCJRr9jHhcrBgNqJUTY1kcU7"
  );
  const manager = new PublicKey(lotToConfirm.manager);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const orderConfirmed = async (confirmed: boolean) => {
    if (!confirmLots) return;
    setLoading(true);
    await confirmLots({
      confirmed,
      orderIndex: lotToConfirm.orderIndex,
      lotIndex: lotToConfirm.lotIndex,
      manager,
      user: onlyClientPk,
    });
    setLoading(false);
    setDone(true);
  };
  return (
    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
      <td>{lotToConfirm.location}</td>
      <td>{lotToConfirm.variety}</td>
      <td>{lotToConfirm.manager}</td>
      <td>{lotToConfirm.numberOfLots}</td>
      <td>
        {(
          lotToConfirm.totalPricePledgedPerLot * lotToConfirm.numberOfLots
        ).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}
      </td>
      <td>
        <div className="flex flex-col space-y-2">
          {done ? (
            <p>Done</p>
          ) : (
            <Fragment>
              <button
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => orderConfirmed(false)}
              >
                Reject Manager
              </button>
              <button
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => orderConfirmed(true)}
              >
                Confirm Order fulfilled
              </button>
            </Fragment>
          )}
        </div>
      </td>
    </tr>
  );
};
export default function OrdersAvailablePage() {
  const { program, lots } = useProgramContext();
  const [lotsToConfirm, setLotsToConfirm] = useState<LotToConfirm[]>([]);
  const torajaCatuiMintIdx = 2;

  useEffect(() => {
    if (!program) return;
    const getLotsToConfirm = async () => {
      const lotsToMaybeConfirmPromise = lots?.lots
        .slice(0, lots.tail.toNumber())
        .map(async (lot, i) => {
          const [lotMetadata, lotMintInfo] = await Promise.all([
            getTokenMetadata(
              program.provider.connection,
              lot.mint,
              undefined,
              TOKEN_2022_PROGRAM_ID
            ),
            getMint(
              program.provider.connection,
              lot.mint,
              undefined,
              TOKEN_2022_PROGRAM_ID
            ),
          ]);
          if (!lotMetadata) return undefined;
          const lotAdditionalMetadata = Object.fromEntries(
            lotMetadata.additionalMetadata
          ) as LotAdditionalMetadata;
          if (lotAdditionalMetadata.state == "1") return undefined;
          return {
            totalPricePledgedPerLot: lot.originalPricePerTree
              .mul(TREES_PER_LOT)
              .div(new BN(100)) // cents to dollars
              .toNumber(),
            manager: lotAdditionalMetadata.manager,
            location: lotAdditionalMetadata.location,
            variety: lotAdditionalMetadata.variety,
            key: lot.mint.toBase58(),
            numberOfLots: Number(lotMintInfo.supply),
            orderIndex: torajaCatuiMintIdx,
            lotIndex: i,
          } as LotToConfirm;
        });
      if (!lotsToMaybeConfirmPromise) return;
      const lotsToMaybeConfirm = await Promise.all(lotsToMaybeConfirmPromise);
      setLotsToConfirm(lotsToMaybeConfirm.filter((lot) => lot !== undefined));
    };
    getLotsToConfirm();
  }, [lots, program]);

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Orders Ready To Be Confirmed</h1>
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
                  Number of Lots
                </th>
                <th scope="col" className="px-6 py-3">
                  Total Price Pledged
                </th>
                <th scope="col" className="px-6 py-3">
                  Confirm?
                </th>
              </tr>
            </thead>
            <tbody>
              {lotsToConfirm.map((lotToConfirm, i) => (
                <OrderConfirmationRow
                  key={lotToConfirm.key}
                  lotToConfirm={lotToConfirm}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
