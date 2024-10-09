"use client";
import React, { useState, useMemo, useEffect, Fragment } from "react";
import { User } from "@/app/models/User";
import {
  convertToCertificationTier,
  useCertificationNumber,
  useCertify,
  useDecertify,
  useManagerCertificationTier,
} from "@/app/hooks/useCertify";
import { PublicKey } from "@solana/web3.js";
import { CertificationTier } from "@/app/contexts/ProgramContext";

// Add deny button
// and revoke button

type Certificate = {
  id: string;
  Users: [{ user: User }];
  status: string;
  type: string;
  application: JsonWebKey;
};

const ApproveButton = ({ managerPK }: { managerPK: string }) => {
  console.log("managerPK", managerPK);

  const certify = useCertify(new PublicKey(managerPK));
  const decertify = useDecertify(new PublicKey(managerPK));
  const managerCertificationTier = useManagerCertificationTier(
    new PublicKey(managerPK)
  );
  const managerCertificationNumber = useCertificationNumber(
    new PublicKey(managerPK)
  );

  return managerCertificationNumber == "loading" ? (
    <>Loading ...</>
  ) : (
    <div className="flex flex-col justify-center space-y-4">
      {managerCertificationTier &&
        managerCertificationTier != "loading" &&
        managerCertificationTier.decertified && (
          <button
            onClick={() => certify({ tier1: {} })}
            disabled
            className="px-4 py-2 red text-white rounded hover:bg-blue-700"
          >
            Approve to{" "}
            {managerCertificationNumber == undefined
              ? "Tier 1"
              : `Tier ${managerCertificationNumber + 1}`}
          </button>
        )}
      {(managerCertificationNumber == undefined ||
        managerCertificationNumber == 0) && (
        <Fragment>
          <button
            onClick={() => certify({ tier1: {} })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Approve to{" "}
            {managerCertificationNumber == undefined
              ? "Tier 1"
              : `Tier ${managerCertificationNumber + 1}`}
          </button>
          <button
            onClick={() => certify({ decertified: {} })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Deny
          </button>
        </Fragment>
      )}
      {(managerCertificationNumber !== undefined ||
        managerCertificationNumber !== 0) && (
        <Fragment>
          <button
            onClick={() => {
              if (managerCertificationNumber == undefined) {
                throw new Error("Should not call while loading");
              }
              certify(
                convertToCertificationTier(
                  managerCertificationNumber! + 1
                ) as CertificationTier
              );
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Approve to {`Tier ${managerCertificationNumber! + 1}`}
          </button>
          <button
            onClick={decertify}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Decertify
          </button>
        </Fragment>
      )}
    </div>
  );
};

const StatusBadge = ({ managerPK }: { managerPK: string }) => {
  const managerCertificationTier = useManagerCertificationTier(
    new PublicKey(managerPK)
  );

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        managerCertificationTier == undefined ||
        managerCertificationTier == "loading" ||
        managerCertificationTier.undefined
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      {managerCertificationTier == "loading"
        ? "Pending"
        : managerCertificationTier == undefined ||
          managerCertificationTier.undefined
        ? "Error"
        : Object.keys(managerCertificationTier)[0]}
    </span>
  );
};

export default function PendingCertificationsPage() {
  const [certifications, setCertifications] = useState<Certificate[]>([]);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const response = await fetch("/api/certification");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log(data);
        setCertifications(data.certifications);
      } catch (error) {
        console.error("Failed to fetch certifications:", error);
      }
    };

    fetchCerts();
  }, []);

  return (
    <div className="space-y-12 px-8">
      <div className="border-b border-gray-900/10 pb-12">
        <h1 className="text-4xl font-bold">Certifications</h1>
      </div>

      <div className="flex flex-col w-full">
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  User ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Manager Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Application
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {certifications.map(
                (certification: Certificate, index: number) => (
                  <tr
                    key={index}
                    className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
                  >
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {certification.Users[0].user.id}
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {certification.Users[0].user.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        managerPK={certification.Users[0].user.walletAddress}
                      />
                    </td>
                    <td
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      {certification.type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {Object.entries(certification.application).map(
                          ([key, value]) => (
                            <div key={key}>
                              <span className="font-bold">{key}:</span>{" "}
                              {String(value)}
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ApproveButton
                        managerPK={certification.Users[0].user.walletAddress}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function useAta() {
  throw new Error("Function not implemented.");
}
