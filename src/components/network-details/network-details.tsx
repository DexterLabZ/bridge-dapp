import { FC, useEffect } from "react";
import { useSelector } from "react-redux";
import blockIcon from "./../../assets/icons/block-solid.svg";
import "./network-details.scss";

const NetworkDetails: FC = () => {
  const internalNetworkConnectionDetails = useSelector((state: any) => state.internalNetworkConnection);

  useEffect(() => {
    document.getElementById("momentum-info-value")?.classList.add("flash-green");
    setTimeout(() => {
      document.getElementById("momentum-info-value")?.classList.remove("flash-green");
    }, 500);
  }, [internalNetworkConnectionDetails.momentumHeight]);

  return (
    <div className="network-details">
      <div className="tooltip d-flex align-items-center">
        {internalNetworkConnectionDetails.momentumHeight !== "" ? (
          <>
            <img src={blockIcon} className="mr-1 select-none" height="18px"></img>
            <div id="momentum-info-value" className="text-bold text-sm">
              {internalNetworkConnectionDetails.momentumHeight}
            </div>
          </>
        ) : (
          <></>
        )}
        <div className="tooltip-text">
          <div>The current momentum height on the connected node.</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetails;
