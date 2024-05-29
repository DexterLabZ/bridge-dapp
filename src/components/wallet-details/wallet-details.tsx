import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { storeErcInfo } from "../../services/redux/walletSlice";
import "./wallet-details.scss";
import useExternalNetwork from "../../services/hooks/externalNetwork-provider/useExternalNetwork";

const WalletDetails: FC = () => {
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const internalNetworkConnectionDetails = useSelector((state: any) => state.internalNetworkConnection);
  const { externalNetworkClient } = useExternalNetwork();
  const externalNetworkConnectionDetails = useSelector((state: any) => state.externalNetworkConnection);
  const referralInfo = useSelector((state: any) => state.referral);
  const [zenonAddress, setZenonAddress] = useState("");
  const [ercAddress, setErcAddress] = useState("");
  const dispatch = useDispatch();
  const globalConstants = useSelector((state: any) => state.globalConstants);

  useEffect(() => {
    console.log("walletDetails - wallet changed");
    console.log("serializedWalletInfo", serializedWalletInfo);

    console.log(JSONbig.parse(serializedWalletInfo["zenonInfo"] || "{}"));
    setZenonAddress(JSONbig.parse(serializedWalletInfo["zenonInfo"] || "{}")?.address || "");

    console.log(JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}"));
    setErcAddress(JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}")?.address || "");
  }, [serializedWalletInfo]);

  return (
    <div className="wallet-details">
      {internalNetworkConnectionDetails?.nodeUrl ? (
        <div className="connection-details">
          <div
            className="tooltip d-flex align-items-center cursor-pointer"
            onClick={() => {
              try {
                navigator.clipboard.writeText(internalNetworkConnectionDetails?.nodeUrl);
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
            {internalNetworkConnectionDetails?.nodeUrl?.split("//")?.[1]?.split(":")?.[0]}
            <div className="connected-dot ml-1"></div>
            <div className="tooltip-text text-left">
              Connected Node: <b>{internalNetworkConnectionDetails?.nodeUrl}</b>
              <br></br>
              Chain ID: <b>{internalNetworkConnectionDetails?.chainIdentifier}</b>
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
          <span className="tooltip-text">
            Zenon Address: <b>{zenonAddress}</b>
          </span>
        </div>
      )}

      {externalNetworkConnectionDetails?.nodeUrl ? (
        <>
          <div
            className="tooltip d-flex align-items-center mt-2 cursor-pointer"
            onClick={() => {
              try {
                navigator.clipboard.writeText(externalNetworkConnectionDetails?.nodeUrl);
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
            {externalNetworkConnectionDetails?.nodeUrl?.split("//")?.[1]?.split(":")?.[0]}

            <div className="connected-dot ml-1"></div>
            <div className="tooltip-text text-left">
              {externalNetworkConnectionDetails?.nodeUrl ? (
                <>
                  Connected Node: <b>{externalNetworkConnectionDetails?.nodeUrl}</b>
                  <br></br>
                </>
              ) : (
                <></>
              )}
              Chain ID: <b>{externalNetworkConnectionDetails?.chainIdentifier}</b>
            </div>
          </div>
        </>
      ) : (
        externalNetworkClient?.displayedProviderType && (
          <div
            className="tooltip d-flex align-items-center mt-2 cursor-pointer"
            onClick={() => {
              try {
                navigator.clipboard.writeText(externalNetworkConnectionDetails?.chainIdentifier);
                toast(`Chain ID copied to clipboard`, {
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
            {externalNetworkClient.displayedProviderType} connected
            <div className="connected-dot ml-1"></div>
            <div className="tooltip-text text-left">
              Chain ID: <b>{externalNetworkConnectionDetails?.chainIdentifier}</b>
            </div>
          </div>
        )
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
          <span className="tooltip-text">
            {externalNetworkClient.displayedProviderType} Address: <b>{ercAddress}</b>
          </span>
        </div>
      )}

      {globalConstants?.isSupernovaNetwork ? (
        <></>
      ) : (
        <>
          {referralInfo.referralCode ? (
            <div className="tooltip d-flex align-items-center mt-2 cursor-pointer">
              Referral code set
              <div className="referred-dot ml-1"></div>
              <span className="tooltip-text">You will get 1% back for every wZNN or wQSR unwrap</span>
            </div>
          ) : (
            <a
              className="no-decoration"
              href="https://twitter.com/hashtag/HyperGrowth"
              target="_blank"
              rel="noreferrer">
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
        </>
      )}
    </div>
  );
};

export default WalletDetails;
