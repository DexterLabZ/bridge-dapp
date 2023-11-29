import { FC } from "react";
import "./extensionConnectionItem.scss";

const ExtensionConnectItem: FC<{
  className?: string;
  step: number;
  address: string;
  logoUrl: string;
  isConnected: boolean;
  isDisabled?: boolean;
  label: string;
  onConnect: () => void;
  largerLogo?: boolean;
}> = ({ className = "", step, address, logoUrl, isConnected, isDisabled = false, label, onConnect, largerLogo }) => {
  return (
    <div
      className={`extension-item dark-shadow-on-hover ${isDisabled ? "disabled" : ""} ${className}`}
      onClick={() => onConnect()}>
      <div className={`step-counter ${isConnected && "completed"}`}>{step}</div>
      <div className="step-content text-center">
        {isConnected ? (
          <>
            {"Connected with "}
            <span className="tooltip">
              {address.slice(0, 3) + "..." + address.slice(-3)}
              <span className="tooltip-text">{address}</span>
            </span>
          </>
        ) : (
          <>{label}</>
        )}
      </div>
      <img
        alt="step-logo"
        className="step-logo extension-logo"
        style={largerLogo ? { maxWidth: "120px", maxHeight: "120px" } : {}}
        src={logoUrl}></img>
    </div>
  );
};

export default ExtensionConnectItem;
