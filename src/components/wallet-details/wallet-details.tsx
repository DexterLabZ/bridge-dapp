import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { storeErcInfo } from "../../services/redux/walletSlice";
import "./wallet-details.scss";

const WalletDetails: FC = () => {
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const connectionInfo = useSelector((state: any) => state.connection);
  const referralInfo = useSelector((state: any) => state.referral);
  const [zenonAddress, setZenonAddress] = useState("");
  const [ercAddress, setErcAddress] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("serializedWalletInfo", serializedWalletInfo);

    console.log(JSONbig.parse(serializedWalletInfo["zenonInfo"] || "{}"));
    setZenonAddress(JSONbig.parse(serializedWalletInfo["zenonInfo"] || "{}")?.address || "");

    console.log(JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}"));
    setErcAddress(JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}")?.address || "");
  }, [serializedWalletInfo]);

  useEffect(() => {
    const changeEventHandlers = detectExtensionsChanges();
    return () => {
      removeWeb3ChangeListeners(changeEventHandlers);
    };
  }, []);

  const detectExtensionsChanges = () => {
    const accountChangedHandler = async (accounts: any) => {
      console.log("accountChangedHandler", accounts);

      const oldErcInfo = JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}");
      dispatch(storeErcInfo(JSONbig.stringify({ ...oldErcInfo, address: accounts[0] })));
    };
    window?.ethereum?.on("accountsChanged", accountChangedHandler);

    const chainChangedHandler = async (chainId: any) => {
      console.log("chainChangedHandler", ethers.BigNumber.from(chainId).toNumber());
      // window.location.reload();
    };
    window?.ethereum?.on("chainChanged", chainChangedHandler);

    return {
      accountsChanged: accountChangedHandler,
      chainChanged: chainChangedHandler,
    };
  };

  const removeWeb3ChangeListeners = (changeEventHandlers: any) => {
    console.log("Removing web3 change listeners", changeEventHandlers);
    window?.ethereum?.removeListener("accountsChanged", changeEventHandlers.accountsChanged);
    window?.ethereum?.removeListener("chainChanged", changeEventHandlers.chainChanged);
  };

  return (
    <div className="wallet-details">
      {connectionInfo?.nodeUrl ? (
        <div className="connection-details">
          <div
            className="tooltip d-flex align-items-center cursor-pointer"
            onClick={() => {
              try {
                navigator.clipboard.writeText(connectionInfo?.nodeUrl);
                toast(`Node URL copied to clipboard`, {
                  position: "bottom-center",
                  autoClose: 2500,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  type: "success",
                  theme: "dark",
                });
              } catch (err) {
                console.error(err);
              }
            }}>
            {connectionInfo?.nodeUrl.split("//")[1].split(":")[0]}
            <div className="connected-dot ml-1"></div>
            <div className="tooltip-text text-left">
              Connected Node: <b>{connectionInfo?.nodeUrl}</b>
              <br></br>
              Chain ID: <b>{connectionInfo?.chainIdentifier}</b>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      {zenonAddress && (
        <div
          className="tooltip d-flex align-items-center mt-2 cursor-pointer"
          onClick={() => {
            try {
              navigator.clipboard.writeText(zenonAddress);
              toast(`Address copied to clipboard`, {
                position: "bottom-center",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                type: "success",
                theme: "dark",
              });
            } catch (err) {
              console.error(err);
            }
          }}>
          {zenonAddress.slice(0, 3) + "..." + zenonAddress.slice(-3)}
          <div className="connected-dot ml-1"></div>
          <span className="tooltip-text">{zenonAddress}</span>
        </div>
      )}
      {ercAddress && (
        <div
          className="tooltip d-flex align-items-center mt-2 cursor-pointer"
          onClick={() => {
            try {
              navigator.clipboard.writeText(ercAddress);
              toast(`Address copied to clipboard`, {
                position: "bottom-center",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                type: "success",
                theme: "dark",
              });
            } catch (err) {
              console.error(err);
            }
          }}>
          {ercAddress.slice(0, 3) + "..." + ercAddress.slice(-3)}
          <div className="connected-dot ml-1"></div>
          <span className="tooltip-text">{ercAddress}</span>
        </div>
      )}

      {referralInfo.referralCode ? (
        <div className="tooltip d-flex align-items-center mt-2 cursor-pointer">
          Referral code set
          <div className="referred-dot ml-1"></div>
          <span className="tooltip-text">You will get 1% back for every wZNN or wQSR unwrap</span>
        </div>
      ) : (
        <a className="no-decoration" href="https://twitter.com/hashtag/HyperGrowth" target="_blank" rel="noreferrer">
          <div className="tooltip d-flex align-items-center mt-2 cursor-pointer text-attention-grabber">
            Get bonus cashback
            <div className="not-connected-dot pulsating-red ml-1"></div>
            <span className="tooltip-text background-clip-fix">
              Use referral code to get 1% bonus cashback for
              <br></br>
              every unwrap from wZNN to ZNN and wQSR to QSR
            </span>
          </div>
        </a>
      )}
    </div>
  );
};

export default WalletDetails;
