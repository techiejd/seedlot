"use client";
import React from "react";
import { useState } from "react";
import { register } from "@/app/repository/user/registerUser";
import { useUserContext } from "@/app/contexts/UserContext";
import Image from "next/image";

export const RegisterModal = ({ walletAddress }: { walletAddress: string }) => {
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState(1);
  const [registering, setRegistering] = useState(false);
  const { setUserDetails, setUserDetailsNotFound } = useUserContext();

  const handleRegister = async () => {
    setRegistering(true);
    try {
      console.log("Registering user...", walletAddress, name, roleId);
      const user = await register(walletAddress, name, roleId);
      console.log("User registered:", user);
      if (user) {
        setUserDetailsNotFound(false);
        setUserDetails(user);
        setRegistering(false);
      }
    } catch (error) {
      console.error("Error registering user:", error);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <label
                  className="text-md leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Are You an Admin, Investor, or Manager?
                </label>
                <div className="mt-2">
                  <select
                    required
                    name="role"
                    onChange={(e) => setRoleId(parseInt(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value={1}>admin</option>
                    <option value={2}>manager</option>
                    <option value={3}>investor</option>
                  </select>
                </div>
                <div className="mt-2">
                  <label
                    className="text-md leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    What is your name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-64 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-900 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <Image src="/images/loading_spinner.svg" alt="Loading..." width={24} height={24} />
              ) : (
                "Register"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
