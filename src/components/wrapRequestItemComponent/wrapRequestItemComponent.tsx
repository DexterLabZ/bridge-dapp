import { ethers } from "ethers";
import { FC, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { WrapRequestItem, wrapRequestStatus } from "../../models/wrapRequestItem";
import constants from "../../utils/constants";
import { openSafelyInNewTab } from "../../utils/utils";
import greenCheckmark from "./../../assets/green-checkmark.svg";
import svgSpinner from "./../../assets/spinner.svg";
import transferArrow from "./../../assets/transfer-arrow.svg";
import "./wrapRequestItemComponent.scss";

const WrapRequestItemComponent: FC<{
  currentChainId: number;
  originalRequestItem: WrapRequestItem;
  onRedeem: (requestItem: WrapRequestItem) => void;
}> = ({ currentChainId, originalRequestItem, onRedeem }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [requestItem, setRequestItem] = useState<WrapRequestItem>(originalRequestItem);
  // In the case where the user deletes localStorage or something like this, requestItem.redeemDelayInSeconds won't be available
  // In this case we should get the fallback value for redeemDelayInSeconds from the constants object.
  const [redeemDelayInSeconds, setRedeemDelayInSeconds] = useState(
    requestItem.redeemDelayInSeconds || constants.wrapRedeemDelayInSeconds
  );
  const interval = useRef<any>();
  const globalConstants = useSelector((state: any) => state.globalConstants);
  const internalNetworkConnectionDetails = useSelector((state: any) => state.internalNetworkConnection);

  useEffect(() => {
    setRequestItem(originalRequestItem);
  }, [originalRequestItem]);

  useEffect(() => {
    console.log("useEffect - requestItem", requestItem);
    setRedeemDelayInSeconds(requestItem.redeemDelayInSeconds || constants.wrapRedeemDelayInSeconds);

    if (requestItem.status == wrapRequestStatus.WaitingDelay && requestItem.timestamp) {
      console.log("Waiting delay updated", requestItem.status, requestItem.timestamp, requestItem.redeemDelayInSeconds);
      clearInterval(interval.current);
      interval.current = setInterval(updateCountDown, 1000, redeemDelayInSeconds);
      return () => clearInterval(interval.current);
    } else {
      clearInterval(interval.current);
    }
  }, [requestItem]);

  const onSelect = (id: string) => {
    if (requestItem.status == wrapRequestStatus.FinalRedeemed) {
      setIsSelected((currentValue: boolean) => !currentValue);
    }
  };

  const changeNetwork = async (request: WrapRequestItem) => {
    if (request.chainId) {
      try {
        await window?.ethereum?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.utils.hexValue(request.chainId) }], // chainId must be in hexadecimal numbers
        });

        toast("Network changed", {
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
        toast("Failed to change network", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "error",
          theme: "dark",
        });
      }
    } else {
      toast("Chain ID not available", {
        position: "bottom-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    }
  };

  const canBeRedeemedAgain = () => {
    if (
      (requestItem.status == wrapRequestStatus.FinalRedeemed || requestItem.status == wrapRequestStatus.Broken) &&
      requestItem.chainId == currentChainId
    ) {
      return true;
    }
    return false;
  };

  const copyTransactionHash = async (transactionHash: string) => {
    try {
      await navigator.clipboard.writeText(transactionHash);
      toast(`Hash copied to clipboard`, {
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
  };

  const goToExplorer = async (request: WrapRequestItem) => {
    console.log("request", request);
    if (request?.status == wrapRequestStatus.FinalRedeemed) {
      // Wrap finished, last transaction is on internal network (zenon)
      await copyTransactionHash(request?.transactionHash ? "0x" + request?.transactionHash : request?.id);
      if (request?.chainId) {
        const explorerBaseUrl = globalConstants.externalNetworkExplorerURLbyChainId[request?.chainId.toString()];
        const explorerURL = explorerBaseUrl + "0x" + request?.transactionHash;
        openSafelyInNewTab(explorerURL);
      }
    } else {
      // Wrap not finished, still on external network (Ethereum)
      await copyTransactionHash(request?.id);
      const explorerURL =
        globalConstants.internalNetworkExplorerURLbyChainId[internalNetworkConnectionDetails.chainIdentifier] +
        request.id;
      openSafelyInNewTab(explorerURL);
    }
  };
  const updateCountDown = (redeemDelayInSeconds: number) => {
    const diffInSeconds = Date.now() / 1000 - (requestItem.timestamp || 0);
    console.log("updateCountDown - diffInSeconds", diffInSeconds);
    console.log("updateCountDown - redeemDelayInSeconds", redeemDelayInSeconds);
    const counter = redeemDelayInSeconds - diffInSeconds;
    console.log("updateCountDown - counter", counter);
    if (counter <= 0) {
      setRequestItem((reqItem: WrapRequestItem) => {
        return {
          ...reqItem,
          status: wrapRequestStatus.PartialRedeemed,
        };
      });
      clearInterval(interval.current);
      console.log("requestItem.status", requestItem.status);
    }
    setCountdown(counter);
    return counter;
  };

  return (
    <div
      className={`request-item-container mb-2 ${isSelected ? " item-is-selected " : ""} ${
        canBeRedeemedAgain() ? " is-redeemable-again " : ""
      }`}>
      <div
        onClick={() => onSelect(requestItem.id)}
        className={`request-item ${requestItem?.isActiveRequest ? " active-request " : ""} ${
          requestItem?.status == wrapRequestStatus.Signing || (countdown < redeemDelayInSeconds && countdown > 0)
            ? " moving-green-shadow "
            : ""
        }`}>
        <div className="mr-3">
          <div className="d-flex align-items-center">
            <div>
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center">
                  <div className="p-relative">
                    <img alt="" className="mr-1" height="42px" src={requestItem?.fromToken?.icon} />
                    <img alt="" className="to-the-power" height="20px" src={requestItem?.fromToken?.network?.icon} />
                  </div>
                  <div className="flex-columns d-flex ml-1">
                    <div className="d-flex text-bold tooltip">
                      {parseFloat(
                        ethers.utils.formatUnits(
                          ethers.BigNumber.from(requestItem.amount?.toString() || 0),
                          ethers.BigNumber.from((requestItem?.fromToken?.decimals?.toString() || 8) + "")
                        )
                      ).toFixed(2) +
                        " " +
                        (requestItem?.fromToken?.symbol || "wZNN")}
                      <span className="tooltip-text">
                        {ethers.utils.formatUnits(
                          ethers.BigNumber.from(requestItem.amount?.toString() || 0),
                          ethers.BigNumber.from((requestItem?.fromToken?.decimals?.toString() || 8) + "")
                        ) +
                          " " +
                          (requestItem?.fromToken?.symbol || "wZNN")}
                      </span>
                    </div>
                    <div className="d-flex text-nowrap align-items-center mt-05">
                      <span className="text-sm text-gray text-semibold tooltip">
                        {requestItem?.fromToken?.name}

                        <span className="text-sm text-white tooltip-text">
                          Token address: {requestItem?.fromToken?.address}
                        </span>
                      </span>
                      <div
                        className="ml-1 small-chip text-xs text-bold tooltip"
                        style={{ color: requestItem?.fromToken?.network?.color }}>
                        {`${requestItem?.fromToken?.network?.name} Network`}
                        <span className="text-sm text-white tooltip-text">
                          Token on {requestItem?.fromToken?.network?.name} network
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="tooltip cursor-pointer" onClick={() => goToExplorer(requestItem)}>
                    <img alt="" className="mr-2 ml-2" height="18px" src={transferArrow} />
                    <span className="tooltip-text">
                      {requestItem?.status == wrapRequestStatus.FinalRedeemed
                        ? `${
                            requestItem?.transactionHash
                              ? "Hash: 0x" + requestItem?.transactionHash
                              : "Zenon Hash: " + requestItem?.id
                          }`
                        : `Zenon Hash: ${requestItem?.id}`}
                    </span>
                  </div>

                  <div className="p-relative">
                    <img alt="" className="mr-1" height="42px" src={requestItem?.toToken?.icon} />
                    <img alt="" className="to-the-power" height="20px" src={requestItem?.toToken?.network?.icon} />
                  </div>
                  <div className="flex-columns d-flex ml-1">
                    <div className="d-flex text-bold tooltip">
                      {parseFloat(
                        ethers.utils.formatUnits(
                          ethers.BigNumber.from(requestItem.amount?.toString() || 0).sub(
                            ethers.BigNumber.from(requestItem?.feeAmount?.toString() || 0)
                          ),
                          ethers.BigNumber.from((requestItem?.toToken?.decimals?.toString() || 8) + "")
                        )
                      ).toFixed(2) +
                        " " +
                        (requestItem?.toToken?.symbol || "wZNN")}
                      <span className="tooltip-text">
                        {ethers.utils.formatUnits(
                          ethers.BigNumber.from(requestItem.amount?.toString() || 0).sub(
                            ethers.BigNumber.from(requestItem?.feeAmount?.toString() || 0)
                          ),
                          ethers.BigNumber.from((requestItem?.toToken?.decimals?.toString() || 8) + "")
                        ) +
                          " " +
                          (requestItem?.toToken?.symbol || "wZNN")}
                      </span>
                    </div>
                    <div className="d-flex text-nowrap align-items-center mt-05">
                      <span className="text-sm text-gray text-semibold tooltip">
                        {requestItem?.toToken?.name}
                        <span className="text-sm text-white tooltip-text">
                          Token address: {requestItem?.toToken?.address}
                        </span>
                      </span>
                      <div
                        className="ml-1 small-chip text-xs text-bold tooltip"
                        style={{ color: requestItem?.toToken?.network?.color }}>
                        {`${requestItem?.toToken?.network?.name} Network`}
                        <span className="text-sm text-white tooltip-text">
                          Token on {requestItem?.toToken?.network?.name} network
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="requestStatus">
          {currentChainId !== requestItem.chainId && requestItem?.status !== wrapRequestStatus.Signing ? (
            <>
              <div
                className={`button thin-button text-sm accent tooltip text-nowrap`}
                onClick={() => changeNetwork(requestItem)}>
                Change<br></br>Network
                <span className="tooltip-text">
                  Request is on a chain that is different form the one you are currently connected to
                </span>
              </div>
            </>
          ) : (
            (() => {
              switch (requestItem.status) {
                case wrapRequestStatus.Redeemable: {
                  return (
                    <div
                      className={`button thin-button primary tooltip text-nowrap`}
                      onClick={() => onRedeem(requestItem)}>
                      Request 1/2
                      {globalConstants.isSupernovaNetwork ? (
                        <span className="tooltip-text">
                          {`If you don't have gas just be patient and the auto-redeemer will redeem it for you`}
                        </span>
                      ) : (
                        <span className="tooltip-text">Wrapping requires 2 steps</span>
                      )}
                    </div>
                  );
                }
                case wrapRequestStatus.WaitingDelay: {
                  return countdown < redeemDelayInSeconds && countdown > 0 ? (
                    <div className="tooltip">
                      {parseFloat(countdown + "").toFixed(0)}s remaining
                      <div className="tooltip-text">
                        <span>The bridge is performing security checks.</span>
                        <br></br>
                        <span>Once the timer is over, you can redeem the funds.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip">
                      estimating...
                      <div className="tooltip-text">
                        <span>The bridge is performing security checks.</span>
                        <br></br>
                        <span>Once the timer is over, you can redeem the funds.</span>
                      </div>
                    </div>
                  );
                }
                case wrapRequestStatus.PartialRedeemed: {
                  return (
                    <div
                      className={`button thin-button primary tooltip text-nowrap`}
                      onClick={() => onRedeem(requestItem)}>
                      Redeem 2/2
                      {globalConstants.isSupernovaNetwork ? (
                        <span className="tooltip-text">
                          {`If you don't have gas just be patient and the auto-redeemer will redeem it for you.`}
                        </span>
                      ) : (
                        <span className="tooltip-text">Wrapping requires 2 steps</span>
                      )}
                    </div>
                  );
                }
                case wrapRequestStatus.FinalRedeemed: {
                  return (
                    <div className="tooltip">
                      <img alt="" className="mr-1 ml-1" height="14px" src={greenCheckmark} />
                      <span className="tooltip-text">{wrapRequestStatus.FinalRedeemed}</span>
                    </div>
                  );
                }

                default: {
                  return (
                    <div className="d-flex align-items-center tooltip">
                      <span className="">{requestItem.status + "..."}</span>
                      {requestItem?.status == wrapRequestStatus.Signing && (
                        <div className="contextual-spinner-container ml-1">
                          <img alt="" src={svgSpinner} className="spinner" />
                          <div className="tooltip-text">
                            <span>The bridge participants are coordinating to validate and sign your request.</span>
                            <br></br>
                            <span>This usually takes about 45 minutes. Please wait.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              }
            })()
          )}
        </div>
      </div>
      <div className="redeem-anyway-container">
        <div className={`button thin-button primary redeem-anyway tooltip`} onClick={() => onRedeem(requestItem)}>
          Redeem<br></br>anyway
          <div className="tooltip-text">
            {requestItem?.status == wrapRequestStatus.FinalRedeemed ? (
              <>
                <span>Successfully redeemed!</span>
                <br></br>
              </>
            ) : (
              <></>
            )}
            <span>Redeem again if problems occurred.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WrapRequestItemComponent;
