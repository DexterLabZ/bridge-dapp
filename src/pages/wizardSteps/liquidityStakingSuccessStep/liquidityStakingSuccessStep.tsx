import { ethers } from "ethers";
import JSONbig from "json-bigint";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LiquidityStakingItem } from "../../../models/LiquidityStakingItem";
import { clearSuccessInfo } from "../../../services/redux/requestsSlice";
import "./liquidityStakingSuccessStep.scss";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const LiquidityStakingSuccessStep: FC<{ onStepSubmit: () => void }> = ({ onStepSubmit = () => {} }) => {
  const dispatch = useDispatch();
  const storedRequests = useSelector((state: any) => state.liquidityStakingEntries);
  const [successInfo, setSuccessInfo] = useState<LiquidityStakingItem>();
  const internalNetworkConnectionDetails = useSelector((state: any) => state.internalNetworkConnection);
  const globalConstants = useSelector((state: any) => state.globalConstants);

  const internalExplorerByChainId: { [index: number]: string } = globalConstants.internalNetworkExplorerURLbyChainId;

  useEffect(() => {
    if (storedRequests.successInfo.length) {
      console.log("successInfo", JSONbig.parse(storedRequests.successInfo || "{}"));

      const succInfo = LiquidityStakingItem.fromJson(JSONbig.parse(storedRequests.successInfo || "{}"));

      console.log("successInfo", succInfo);

      setSuccessInfo(succInfo);

      dispatch(clearSuccessInfo());
    }
  }, []);

  const goToExplorer = () => {
    console.log("To explorer");
  };

  return (
    <div className="mt-4">
      <h2 className="w-100 text-center">Successfully staked</h2>

      <div className="mt-5">
        <div className="w-100 text-center d-flex align-items-center justify-content-center flex-wrap">
          <div className="w-100">
            <h1 className="mt-0 mb-1">
              <span className="text-white mr-1 tooltip">
                {ethers.utils.formatUnits(
                  ethers.BigNumber.from(successInfo?.amount?.toString() || 0),
                  ethers.BigNumber.from((successInfo?.token?.decimals?.toString() || 8) + "")
                )}
                <span className="tooltip-text">
                  {ethers.utils.formatUnits(
                    ethers.BigNumber.from(successInfo?.amount?.toString() || 0),
                    ethers.BigNumber.from((successInfo?.token?.decimals?.toString() || 8) + "")
                  )}
                </span>
              </span>
              <span style={{ color: successInfo?.token?.network?.color }}>{successInfo?.token?.symbol}</span>
            </h1>
            <div className="tooltip">
              <span className="text-gray">
                {successInfo?.stakeAddress.toString() &&
                  successInfo?.stakeAddress.toString()?.slice(0, 3) +
                    "..." +
                    successInfo?.stakeAddress.toString()?.slice(-3)}
              </span>
              <span className="tooltip-text mt-5">{successInfo?.stakeAddress.toString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 success-buttons-container">
        <a
          className="no-decoration"
          href={internalExplorerByChainId[internalNetworkConnectionDetails.chainIdentifier] + (successInfo?.id || "")}
          target="_blank"
          rel="noreferrer">
          <div className={`button mt-2 accent text-white`} onClick={() => goToExplorer()}>
            Discover transaction in the block explorer
          </div>
        </a>

        <div className={`button mt-2 primary text-white`} onClick={() => onStepSubmit()}>
          Discover all the liquidity staking entries
        </div>
      </div>
    </div>
  );
};

export default LiquidityStakingSuccessStep;
