import { FC, useEffect } from "react";
import useZenon from "../../services/hooks/zenon-provider/useZenon";
import { zenonProviderTypes } from "../../services/hooks/zenon-provider/zenonContext";

const WalletConnectButton: FC = () => {
  const { zenonClient } = useZenon();

  useEffect(() => {
    console.log("WalletConnectButton");
  }, []);

  const connectWallet = async () => {
    try {
      console.log("connectWallet");
      await zenonClient.connect(zenonProviderTypes.walletConnect);
      console.log("zenonClient", zenonClient);
      const zenonInfo = await zenonClient.getWalletInfo();
      console.log("zenonInfo", zenonInfo);
    } catch (err) {
      console.error("ZenonClient error", err);
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
