import { ethers } from "ethers";
import JSONbig from "json-bigint";
import { FC, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { UnwrapRequestItem, unwrapRequestStatus } from "../../models/unwrapRequestItem";
import constants from "../../utils/constants";
import { hasLowPlasma, openSafelyInNewTab } from "../../utils/utils";
import greenCheckmark from "./../../assets/green-checkmark.svg";
import defaultZenonNewtorkIcon from "./../../assets/networks/zenon.svg";
import svgSpinner from "./../../assets/spinner.svg";
import defaultErcNewtorkIcon from "./../../assets/tokens/eth-purple.svg";
import defaultTokenIcon from "./../../assets/tokens/zts.svg";
import transferArrow from "./../../assets/transfer-arrow.svg";
import warningIcon from "./../../assets/warning-icon.svg";
import "./unwrapRequestItemComponent.scss";

const UnwrapRequestItemComponent: FC<{
  requestItem: UnwrapRequestItem;
  onRedeem: (requestItem: UnwrapRequestItem) => void;
}> = ({ requestItem, onRedeem }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<any>();
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const [plasmaBalance, setPlasmaBalance] = useState(0);
  const globalConstants = useSelector((state: any) => state.globalConstants);
  const internalNetworkConnectionDetails = useSelector((state: any) => state.internalNetworkConnection);

  useEffect(() => {
    const zenonInfo = JSONbig.parse(serializedWalletInfo?.["zenonInfo"] || "{}");
    if (zenonInfo && zenonInfo?.plasma && zenonInfo?.plasma?.currentPlasma) {
      setPlasmaBalance(zenonInfo?.plasma?.currentPlasma);
    }
  }, [serializedWalletInfo]);

  useEffect(() => {
    console.log(requestItem.status, requestItem.redeemableIn);

    if (requestItem.status == unwrapRequestStatus.WaitingConfirmation && (requestItem.redeemableIn || 0) > 0) {
      console.log("requestItem.redeemableIn", requestItem.redeemableIn);
      console.log("requestItem.status", requestItem.timestamp);
      console.log(
        "(requestItem.redeemableIn || 1) * constants.estimatedMomentumTimeInSeconds",
        (requestItem.redeemableIn || 1) * constants.estimatedMomentumTimeInSeconds
      );

      setCountdown((requestItem.redeemableIn || 1) * constants.estimatedMomentumTimeInSeconds);
      clearInterval(countdownInterval.current);
      countdownInterval.current = setInterval(updateCountDown, 1000);
      return () => clearInterval(countdownInterval.current);
    } else {
      clearInterval(countdownInterval.current);
    }
  }, [requestItem]);

  const onSelect = (id: string) => {
    if (requestItem.status == unwrapRequestStatus.Redeemed) {
      setIsSelected((currentValue: boolean) => !currentValue);
    }
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

  const goToExplorer = async (request: UnwrapRequestItem) => {
    console.log("request", request);
    if (request?.status == unwrapRequestStatus.Redeemed) {
      // Unwrap finished, last transaction is on external network (Ethereum)
      await copyTransactionHash(request?.id || request?.transactionHash);
      const explorerURL =
        globalConstants.internalNetworkExplorerURLbyChainId[internalNetworkConnectionDetails.chainIdentifier] +
        request?.id;
      openSafelyInNewTab(explorerURL);
    } else {
      // Unwrap not finished, still on internal network (zenon)
      await copyTransactionHash("0x" + request?.transactionHash);
      if (request?.chainId) {
        const explorerBaseUrl = globalConstants.externalNetworkExplorerURLbyChainId[request?.chainId.toString()];
        const explorerURL = explorerBaseUrl + "0x" + request?.transactionHash;
        openSafelyInNewTab(explorerURL);
      }
    }
  };

  const canBeRedeemedAgain = () => {
    if (requestItem.status == unwrapRequestStatus.Redeemed || requestItem.status == unwrapRequestStatus.Broken) {
      return true;
    }
    return false;
  };

  const updateCountDown = () => {
    setCountdown((val) => {
      console.log("countdown", val);
      if (val <= 0) {
        requestItem.status = unwrapRequestStatus.Redeemable;
        clearInterval(countdownInterval.current);
      }
      return val - 1;
    });
  };

  return (
    <div
      className={`request-item-container mb-2 ${isSelected ? " item-is-selected " : ""} ${
        canBeRedeemedAgain() ? " is-redeemable-again " : ""
      }`}>
      <div
        onClick={() => onSelect(requestItem.transactionHash)}
        className={`request-item ${requestItem?.isActiveRequest ? " active-request " : ""} ${
          requestItem?.status == unwrapRequestStatus.Signing ? " moving-green-shadow " : ""
        }`}>
        <div>
          <div className="d-flex align-items-center">
            <div>
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center">
                  <div className="p-relative">
                    <img alt="" className="mr-1" height="42px" src={requestItem?.fromToken?.icon || defaultTokenIcon} />
                    <img
                      alt=""
                      className="to-the-power"
                      height="20px"
                      src={requestItem?.fromToken?.network?.icon || defaultErcNewtorkIcon}
                    />
                  </div>
                  {requestItem?.isFromAffiliation ? (
                    <div className="flex-columns d-flex ml-1">
                      <div className="affiliate-bonus-card  tooltip">
                        <span className="text-qsr">Affiliate</span>
                        <span className="tooltip-text">Affiliate bonus</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-columns d-flex ml-1">
                      <div className="d-flex text-bold tooltip">
                        {parseFloat(
                          ethers.utils.formatUnits(
                            ethers.BigNumber.from((requestItem.originalAmount || requestItem.amount)?.toString() || 0),
                            ethers.BigNumber.from((requestItem?.fromToken?.decimals?.toString() || 8) + "")
                          )
                        ).toFixed(2) +
                          " " +
                          (requestItem?.fromToken?.symbol || "wZNN")}
                        <span className="tooltip-text">
                          {ethers.utils.formatUnits(
                            ethers.BigNumber.from((requestItem.originalAmount || requestItem.amount)?.toString() || 0),
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
                  )}

                  <div className="tooltip cursor-pointer" onClick={() => goToExplorer(requestItem)}>
                    <img alt="" className="mr-2 ml-2" height="18px" src={transferArrow} />
                    <span className="tooltip-text">
                      {requestItem?.status == unwrapRequestStatus.Redeemed
                        ? `Hash: ${requestItem?.id || requestItem?.transactionHash}`
                        : `Hash: 0x${requestItem?.transactionHash}`}
                    </span>
                  </div>

                  <div className="p-relative">
                    <img alt="" className="mr-1" height="42px" src={requestItem?.toToken?.icon || defaultTokenIcon} />
                    <img
                      alt=""
                      className="to-the-power"
                      height="20px"
                      src={requestItem?.toToken?.network?.icon || defaultZenonNewtorkIcon}
                    />
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
                        (requestItem?.toToken?.symbol || "ZNN")}
                      <span className="tooltip-text">
                        {ethers.utils.formatUnits(
                          ethers.BigNumber.from(requestItem.amount?.toString() || 0),
                          ethers.BigNumber.from((requestItem?.toToken?.decimals?.toString() || 8) + "")
                        ) +
                          " " +
                          (requestItem?.toToken?.symbol || "ZNN")}
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
          {requestItem.status == unwrapRequestStatus.Redeemable ? (
            <div className="d-block">
              <div className="d-flex align-items-center justify-content-center">
                {hasLowPlasma(plasmaBalance) ? (
                  <div className="tooltip d-flex align-items-center">
                    <img alt="fees-info" className="switch-arrow mr-1" src={warningIcon} />

                    <span className="tooltip-text">
                      It seems that you have low plasma. We recommend fusing at least 50 QSR in the Syrius extension
                      <br></br>before making the transaction in order to speed up the process.
                    </span>
                  </div>
                ) : (
                  <></>
                )}

                <div
                  className={`button thin-button primary tooltip text-nounwrap`}
                  onClick={() => onRedeem(requestItem)}>
                  Redeem
                  <span className="tooltip-text">Redeem to receive your funds</span>
                </div>
              </div>
            </div>
          ) : requestItem.status == unwrapRequestStatus.WaitingConfirmation ? (
            countdown < (requestItem.redeemableIn || 1) * constants.estimatedMomentumTimeInSeconds && countdown > 0 ? (
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
            )
          ) : requestItem.status == unwrapRequestStatus.Redeemed ? (
            <div className="tooltip">
              <img alt="" className="mr-1 ml-1" height="14px" src={greenCheckmark} />
              <span className="tooltip-text">{unwrapRequestStatus.Redeemed}</span>
            </div>
          ) : (
            <div className="d-flex align-items-center tooltip">
              <span className="">{requestItem.status + "..."}</span>
              {requestItem?.status == unwrapRequestStatus.Signing && (
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
          )}
        </div>
      </div>
      <div className="redeem-anyway-container">
        <div className={`button thin-button primary redeem-anyway tooltip`} onClick={() => onRedeem(requestItem)}>
          Redeem<br></br>anyway
          <div className="tooltip-text">
            {requestItem?.status == unwrapRequestStatus.Redeemed && (
              <>
                <span>Successfully redeemed!</span>
                <br></br>
              </>
            )}
            <span>Redeem again if problems occurred.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnwrapRequestItemComponent;
