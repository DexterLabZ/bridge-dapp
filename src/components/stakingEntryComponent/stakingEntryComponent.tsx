import { ethers } from "ethers-ts";
import { FC, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { LiquidityStakingItem, liquidityStakingStatus } from "../../models/LiquidityStakingItem";
import { secondsToDuration } from "../../utils/utils";
import greenCheckmark from "./../../assets/green-checkmark.svg";
import svgSpinner from "./../../assets/spinner.svg";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const StakingEntryComponent: FC<{
  stakingItem: LiquidityStakingItem;
  onRevoke: (stakingItem: LiquidityStakingItem) => void;
}> = ({ stakingItem, onRevoke }) => {
  const [countdown, setCountdown] = useState(0);
  const countdownInterval = useRef<any>();

  useEffect(() => {
    console.log("stakingItemComponent", stakingItem);
    if (
      stakingItem.status == liquidityStakingStatus.Waiting &&
      (!stakingItem?.revokeTime || stakingItem?.revokeTime == 0) &&
      stakingItem.expirationTime > 0 &&
      stakingItem.expirationTime - Date.now() / 1000 > 0
    ) {
      setCountdown(stakingItem.expirationTime - Date.now() / 1000 || 1);
      clearInterval(countdownInterval.current);
      console.log("stakingItem.expirationTime", stakingItem.expirationTime);
      countdownInterval.current = setInterval(updateCountDown, 1000);
      return () => clearInterval(countdownInterval.current);
    } else {
      clearInterval(countdownInterval.current);
    }
  }, [stakingItem]);

  useEffect(() => {
    console.log("stakingItemComponent", stakingItem);
  }, []);

  const updateCountDown = () => {
    setCountdown((val) => {
      if (val <= 0) {
        stakingItem.status = liquidityStakingStatus.Revokable;
        clearInterval(countdownInterval.current);
      }
      return val - 1;
    });
  };

  return (
    <div className="request-item-container mb-2">
      <div
        className={`request-item ${stakingItem?.isActiveRequest ? " active-request " : ""} ${stakingItem?.status == liquidityStakingStatus.Pending ? " moving-green-shadow " : ""
          }`}>
        <div className="w-100 d-flex align-items-center justify-content-between">
          <div className="mr-3 d-flex align-items-center">
            <img alt="" className="mr-3" height="42px" src={stakingItem?.token?.icon} />

            <div className="">
              <div className="tooltip">
                {`Staked 
                ${ethers.utils.formatUnits(
                  ethers.BigNumber.from((stakingItem.amount?.toString() || 0) + ""),
                  ethers.BigNumber.from((stakingItem?.token?.decimals?.toString() || 8) + "")
                )}
                ${stakingItem?.token?.symbol} 
              `}
                <div className="tooltip-text">
                  {`${ethers.utils.formatUnits(
                    ethers.BigNumber.from((stakingItem.amount?.toString() || 0) + ""),
                    ethers.BigNumber.from((stakingItem?.token?.decimals?.toString() || 8) + "")
                  )} ${stakingItem?.token?.symbol} 
              `}
                </div>
              </div>
              <div
                className="text-gray tooltip cursor-pointer"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText("0x" + stakingItem?.id?.toString());
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
                }}>
                {`Hash: ${stakingItem?.id?.toString()?.slice(0, 3) + "..." + stakingItem?.id?.toString()?.slice(-3)}`}

                <div className="tooltip-text">{`Hash: ${stakingItem?.id?.toString()}`}</div>
              </div>
            </div>
          </div>

          <div className="requestStatus">
            {(() => {
              switch (stakingItem.status) {
                case liquidityStakingStatus.Revokable: {
                  return (
                    <div
                      className={`button thin-button warning tooltip text-nowrap`}
                      onClick={() => onRevoke(stakingItem)}>
                      Cancel
                      <span className="tooltip-text">Get your staked tokens back</span>
                    </div>
                  );
                }
                case liquidityStakingStatus.Waiting: {
                  return countdown > 0 ? (
                    <div className="tooltip">
                      {`Cancel in ${secondsToDuration(countdown)}`}
                      <div className="tooltip-text">
                        <span>Once the timer is over,</span>
                        <br></br>
                        <span>You will be able to get back your staked tokens.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip">
                      estimating...
                      <div className="tooltip-text">
                        <span>Once the timer is over,</span>
                        <br></br>
                        <span>You will be able to get back your staked tokens.</span>
                      </div>
                    </div>
                  );
                }
                case liquidityStakingStatus.Revoked: {
                  return (
                    <div className="tooltip">
                      <img alt="" className="mr-1 ml-1" height="14px" src={greenCheckmark} />
                      <span className="tooltip-text">{"Successfully " + liquidityStakingStatus.Revoked}</span>
                    </div>
                  );
                }
                case liquidityStakingStatus.Pending: {
                  return (
                    <div className="d-flex align-items-center tooltip">
                      <span className="">{"Pending"}</span>
                      <div className="contextual-spinner-container ml-1">
                        <img alt="" src={svgSpinner} className="spinner" />
                        <div className="tooltip-text">
                          <span>Pending...</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                case undefined: {
                  return (
                    <div className="d-flex align-items-center tooltip">
                      <span className="">{"Pending"}</span>
                      <div className="contextual-spinner-container ml-1">
                        <img alt="" src={svgSpinner} className="spinner" />
                        <div className="tooltip-text">
                          <span>Pending...</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                default: {
                  return (
                    <div className="d-flex align-items-center tooltip">
                      <span className="">{stakingItem.status + "..."}</span>
                      {stakingItem?.status == liquidityStakingStatus.Pending && (
                        <div className="contextual-spinner-container ml-1">
                          <img alt="" src={svgSpinner} className="spinner" />
                          <div className="tooltip-text">
                            <span>Pending...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingEntryComponent;
