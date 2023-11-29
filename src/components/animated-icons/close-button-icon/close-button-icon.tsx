import { FC } from "react";
import "./close-button-icon.scss";

const CloseIconButton: FC = () => {
  return (
    <div className="close-button-icon-container" style={{ padding: 0 + "px" }}>
      <div className="close-button-icon">
        <div className="close-button-icon-dash" id="top" style={{ top: 2 + "px", left: -1 + "px" }}></div>
        <div className="close-button-icon-dash" id="bottom" style={{ top: 16 + "px", left: -1 + "px" }}></div>
      </div>
    </div>
  );
};

export default CloseIconButton;
