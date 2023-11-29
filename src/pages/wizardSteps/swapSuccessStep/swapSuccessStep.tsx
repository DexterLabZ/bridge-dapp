import { ethers } from "ethers";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { UnwrapRequestItem } from "../../../models/unwrapRequestItem";
import { clearSuccessInfo } from "../../../services/redux/requestsSlice";
import { flowTypes } from "../../../services/redux/wizardStatusSlice";
import sendRightIcon from "./../../../assets/transfer-arrow.svg";
import "./swapSuccessStep.scss";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const SwapSuccessStep: FC<{ onStepSubmit: () => void }> = ({ onStepSubmit = () => { } }) => {
  const dispatch = useDispatch();
  const storedRequests = useSelector((state: any) => state.requests);
  const [successInfo, setSuccessInfo] = useState<any>();
  const [isWrapRequest, setIsWrapRequest] = useState<boolean>();
  const globalConstants = useSelector((state: any) => state.globalConstants);

  const externalExplorerByChainId: { [index: number]: string } = globalConstants.externalNetworkExplorerURLbyChainId;
  const internalExplorerByChainId: { [index: number]: string } = globalConstants.internalNetworkExplorerURLbyChainId;
  const networkDetailsState = useSelector((state: any) => state.connection);

  const wizardStatus = useSelector((state: any) => state.wizardStatus);

  useEffect(() => {
    console.log("successInfo", JSON.parse(storedRequests.successInfo || "{}"));

    const succInfo = JSON.parse(storedRequests.successInfo || "{}");
    console.log("successInfo", succInfo);

    if (succInfo?.toAddress?.toLowerCase()?.startsWith("0x")) {
      setIsWrapRequest(true);
      console.log("setIsWrapRequest(true);");
    } else {
      setIsWrapRequest(false);
      console.log("setIsWrapRequest(false);");
    }

    setSuccessInfo(succInfo);

    dispatch(clearSuccessInfo());
  }, []);

  const goToExplorer = () => {
    console.log("To explorer");
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

  const addTokenToMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      let externalToken: any = {};
      if (isWrapRequest) {
        externalToken = successInfo?.toToken;
      } else {
        externalToken = successInfo?.fromToken;
      }

      try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await window?.ethereum?.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20", // Initially only supports ERC20, but eventually more!
            options: {
              address: externalToken.address, // The address that the token is at.
              symbol: externalToken.symbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: externalToken.decimals, // The number of decimals in the token
              image: externalToken.icon, // A string url of the token logo
            },
          },
        });

        if (wasAdded) {
          toast("Token successfully added", {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "success",
            theme: "dark",
          });
        } else {
          toast("Failed to add token", {
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
      } catch (error: any) {
        console.error(error);
        toast(error?.message + "", {
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
    }
  };

  return (
    <div className="mt-4">
      <h2 className="w-100 text-center">{`Successfully ${isWrapRequest ? "wrapped" : "unwrapped"}`}</h2>

      <div className="mt-5">
        <div className="w-100 text-center d-flex align-items-center justify-content-center flex-wrap">
          {successInfo?.isFromAffiliation ? (
            <div className="flex-columns d-flex ml-1">
              <div className="affiliate-success-card  tooltip">
                <span className="text-qsr">Affiliate</span>
                <span className="tooltip-text">Affiliate bonus</span>
              </div>
            </div>
          ) : (
            <div className="w-100">
              <h1 className="mt-0 mb-1">
                <span className="text-white mr-1 tooltip">
                  {ethers.utils.formatUnits(
                    ethers.BigNumber.from(successInfo?.amount?.toString() || 0),
                    ethers.BigNumber.from((successInfo?.fromToken?.decimals?.toString() || 8) + "")
                  )}
                  <span className="tooltip-text">
                    {ethers.utils.formatUnits(
                      ethers.BigNumber.from(successInfo?.amount?.toString() || 0),
                      ethers.BigNumber.from((successInfo?.fromToken?.decimals?.toString() || 8) + "")
                    )}
                  </span>
                </span>
                <span style={{ color: successInfo?.fromToken?.network?.color }}>
                  {successInfo?.fromToken?.symbol || (isWrapRequest ? "ZNN" : "wZNN")}
                </span>
              </h1>
              <div className="tooltip">
                <span className="text-gray">
                  {successInfo?.fromAddress &&
                    successInfo?.fromAddress?.slice(0, 3) + "..." + successInfo?.fromAddress?.slice(-3)}
                </span>
                <span className="tooltip-text mt-5">{successInfo?.fromAddress}</span>
              </div>
            </div>
          )}
          <div className="w-100 m-3">
            <div
              className="tooltip cursor-pointer"
              onClick={() =>
                copyTransactionHash(
                  isWrapRequest ? `0x${successInfo?.transactionHash}` : successInfo?.id || successInfo?.transactionHash
                )
              }>
              <img alt="" className="rotate-90" height="24px" style={{ userSelect: "none" }} src={sendRightIcon} />
              <span className="tooltip-text">
                {isWrapRequest
                  ? `Hash: 0x${successInfo?.transactionHash}`
                  : `Hash: ${successInfo?.id || successInfo?.transactionHash}`}
              </span>
            </div>
          </div>
          <div className="w-100">
            <h1 className="mt-0 mb-1">
              <span className="text-white mr-1 tooltip">
                {ethers.utils.formatUnits(
                  ethers.BigNumber.from(successInfo?.amount?.toString() || 0).sub(
                    ethers.BigNumber.from(successInfo?.feeAmount?.toString() || 0)
                  ),
                  ethers.BigNumber.from((successInfo?.toToken?.decimals?.toString() || 8) + "")
                )}
                <span className="tooltip-text">
                  {ethers.utils.formatUnits(
                    ethers.BigNumber.from(successInfo?.amount?.toString() || 0).sub(
                      ethers.BigNumber.from(successInfo?.feeAmount?.toString() || 0)
                    ),
                    ethers.BigNumber.from((successInfo?.toToken?.decimals?.toString() || 8) + "")
                  )}
                </span>
              </span>
              <span style={{ color: successInfo?.toToken?.network?.color }}>
                {successInfo?.toToken?.symbol || (isWrapRequest ? "wZNN" : "ZNN")}
              </span>
            </h1>
            <div className="tooltip">
              <span className="text-gray">
                {successInfo?.toAddress &&
                  successInfo?.toAddress?.slice(0, 3) + "..." + successInfo?.toAddress?.slice(-3)}
              </span>
              <span className="tooltip-text mt-5">{successInfo?.toAddress}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 success-buttons-container">
        <div
          className={`button secondary text-white mt-4 d-flex align-items-center justify-content-center p-1`}
          onClick={() => addTokenToMetamask()}>
          {`Add ${isWrapRequest ? successInfo?.toToken?.symbol : successInfo?.fromToken?.symbol} to Metamask`}
          <img
            alt="add to metamask"
            className="text-button-icon ml-1"
            height={37}
            src={require("./../../../assets/logos/metamask.png")}></img>
        </div>
        {isWrapRequest ? (
          <a
            className="no-decoration"
            href={externalExplorerByChainId[successInfo?.chainId] + "0x" + (successInfo?.transactionHash || "")}
            target="_blank"
            rel="noreferrer">
            <div className={`button mt-2 accent text-white`} onClick={() => goToExplorer()}>
              See transaction in block explorer
            </div>
          </a>
        ) : (
          <a
            className="no-decoration"
            href={internalExplorerByChainId[networkDetailsState.chainIdentifier] + (successInfo?.id || "")}
            target="_blank"
            rel="noreferrer">
            <div className={`button mt-2 accent text-white`} onClick={() => goToExplorer()}>
              See transaction in block explorer
            </div>
          </a>
        )}
        {wizardStatus.metaFlowType === flowTypes.LiquidityStaking && wizardStatus.currentFlowType === flowTypes.Swap ? (
          <div className={`button mt-2 primary text-white`} onClick={() => onStepSubmit()}>
            Continue to staking liquidity
          </div>
        ) : (
          <div className={`button mt-2 primary text-white`} onClick={() => onStepSubmit()}>
            Start new swap
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapSuccessStep;
