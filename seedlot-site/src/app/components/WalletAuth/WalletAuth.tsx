import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useUserDetails } from "../../hooks/useUserDetails";

/**
 * WalletAuth component handles the authentication process using a wallet.
 *
 * This component:
 * - Checks if the wallet is connected.
 * - Retrieves the public key and signMessage function from the wallet.
 * - Signs a message and authenticates with Firebase.
 * - Displays a modal for user role selection if the user is not found.
 *
 * @component
 * @example
 * return (
 *   <WalletAuth />
 * )
 *
 * @returns {JSX.Element} The WalletAuth component.
 *
 * @remarks
 * This component uses the `useWallet` hook to interact with the wallet.
 * It also uses the `useState` and `useEffect` hooks from React.
 *
 * @function signAndAuthenticate
 * Signs a message with the wallet's private key and sends it to the backend for authentication.
 *
 * @function fetchData
 * Fetches user data based on the wallet's public key and triggers authentication if the user is found.
 *
 * @state {boolean} isModalOpen - State to control the visibility of the modal.
 *
 * @hook {useWallet} useWallet - Hook to interact with the wallet.
 * @hook {useState} useState - Hook to manage component state.
 * @hook {useEffect} useEffect - Hook to perform side effects in the component.
 */
export const WalletAuth = () => {
  const WalletMultiButton = dynamic(
    () =>
      import("@solana/wallet-adapter-react-ui").then(
        (mod) => mod.WalletMultiButton
      ),
    {
      loading: () => <p>loading...</p>,
    }
  );
  const { connected, publicKey } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userDetails, registrationRequired } = useUserDetails();
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState(1);

  const register = async () => {
    try {
      if (!publicKey) return;
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicKey, name, roleId }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      const result = await response.json();
      setIsModalOpen(false);
      return result.user;
    } catch (error) {
      throw new Error("Error storing new user data");
    }
  };

  useEffect(() => {
    if (registrationRequired) setIsModalOpen(true);
  }, [registrationRequired]);

  return (
    <div>
      <WalletMultiButton className="mt-2 mb-8" />

      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-900 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={register}
                >
                  Register
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
