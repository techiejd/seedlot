// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useProgramContext } from "@/app/contexts/ProgramContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

// WalletAuth component
export const WalletAuth = () => {
  const { program, contract, contractAddress } = useProgramContext();
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.connected) {
      // Make sure to load or initialize the program once the wallet is connected
      // The program and contract details should be ready to use.
      console.log("Program initialized:", program);
    }
  }, [wallet.connected]);

  const WalletMultiButton = dynamic(
    () =>
      import("@solana/wallet-adapter-react-ui").then(
        (mod) => mod.WalletMultiButton
      ),
    {
      loading: () => <Image src="/images/loading_spinner.svg" alt="Loading..." width={24} height={24} />,
      ssr: false, // Disable server-side rendering to ensure this only loads on the client
    }
  );

  return (
    <div>
      <WalletMultiButton className="mt-2 mb-8" />
    </div>
  );
};
