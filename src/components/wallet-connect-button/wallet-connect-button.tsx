import { FC, useEffect } from "react";
import useInternalNetwork from "../../services/hooks/internalNetwork-provider/useInternalNetwork";
import { internalNetworkProviderTypes } from "../../services/hooks/internalNetwork-provider/internalNetworkContext";

const WalletConnectButton: FC = () => {
  const { internalNetworkClient } = useInternalNetwork();

  useEffect(() => {
    console.log("WalletConnectButton");
  }, []);

  const connectWallet = async () => {
    try {
      console.log("connectWallet");
      await internalNetworkClient.connect(internalNetworkProviderTypes.walletConnect);
      console.log("internalNetworkClient", internalNetworkClient);
      const zenonInfo = await internalNetworkClient.getWalletInfo();
      console.log("zenonInfo", zenonInfo);
    } catch (err) {
      console.error("internalNetworkClient error", err);
    }
  };

  return (
    <div className="wallet-connect-provider">
      <div onClick={connectWallet} className="p-relative pr-3 pl-3 pt-1 pb-1 button primary">
        Wallet Connect
      </div>
    </div>
  );
};

export default WalletConnectButton;
