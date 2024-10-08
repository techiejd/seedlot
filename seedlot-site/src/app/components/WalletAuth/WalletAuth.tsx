import dynamic from "next/dynamic";
import Image from "next/image";


export const WalletAuth = () => {

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
