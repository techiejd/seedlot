"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useUserContext } from "@/app/contexts/UserContext";

export default function ApplyManagerPage() {
  const [growingDuration, setGrowingDuration] = useState("");
  const [harvestDuration, setHarvestDuration] = useState("");
  const [sunOrShade, setSunOrShade] = useState("");
  const [altitude, setAltitude] = useState("");
  const [treeLocation, setTreeLocation] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const { userDetails } = useUserContext();
  const [certificationInProgress, setCertificationInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certificationStatus, setCertificationStatus] = useState("");
  const [understandContract, setUnderstandContract] = useState(false);
  const [understandSolana, setUnderstandSolana] = useState(false);

  useEffect(() => {
    console.log(userDetails);
    if (userDetails?.id) {
      fetch(`/api/certification/${userDetails.id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Success:", data);
          console.log(data.certifications);
          if (data.certifications) {
            setCertificationInProgress(true);
            setCertificationStatus("approved");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userDetails]);

  const handleCertificationApply = () => {
    const certificateApplication = {
      growingDuration,
      harvestDuration,
      sunOrShade,
      altitude,
      treeLocation,
      farmLocation,
      understandContract,
      understandSolana,
    };

    fetch("/api/certification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userDetails?.id,
        type: "managerTier1",
        status: "pending",
        application: certificateApplication,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  return (
    <div className="space-y-12 px-8">
      <div className="pb-8">
        <h1 className="text-4xl font-bold">Manager Application for Certification</h1>
      </div>
      {loading ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="animate-spin h-5 w-5 text-white"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          ></circle>
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          ></path>
        </svg>
      ) : certificationInProgress ? (
        <div
          className={`p-4 border-l-4 ${
            certificationStatus === "pending"
              ? "bg-yellow-100 border-yellow-500 text-yellow-700"
              : certificationStatus === "approved"
              ? "bg-green-100 border-green-500 text-green-700"
              : ""
          }`}
          role="alert"
        >
          <p className="font-bold">Certification Application Status</p>
          <p>{certificationStatus} - Tier 2</p>
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleCertificationApply();
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              How long have you been growing coffee trees
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={growingDuration}
              onChange={(e) => setGrowingDuration(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              How long does a standard coffee tree take to first harvest
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={harvestDuration}
              onChange={(e) => setHarvestDuration(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Do coffee trees like to grow in the sun or under shade
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={sunOrShade}
              onChange={(e) => setSunOrShade(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              What altitude do coffee trees grow at
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={altitude}
              onChange={(e) => setAltitude(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              If you were a coffee tree, where would you grow?
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={treeLocation}
              onChange={(e) => setTreeLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="mr-2 leading-tight"
                required
                checked={understandContract}
                onChange={(e) => setUnderstandContract(e.target.checked)}
              />
              I understand that this is a digitization of the physical contract
              I filled in earlier and that there are actual legal consequences
              in my home country
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="mr-2 leading-tight"
                required
                checked={understandSolana}
                onChange={(e) => setUnderstandSolana(e.target.checked)}
              />
              I understand how to use Solana
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Where is your farm located?
            </label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg p-2"
              value={farmLocation}
              onChange={(e) => setFarmLocation(e.target.value)}
            >
              <option value="toraja">Toraja</option>
              <option value="sarawak">Sarawak</option>
              <option value="kintamani">Kintamani</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Apply for Certification
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
