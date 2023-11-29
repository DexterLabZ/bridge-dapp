import { FC, useContext } from "react";
import ReactDOM from "react-dom";
import { SpinnerContext } from "./spinnerContext";
import spinnerSvg from "./../../../assets/spinner.svg";

const Spinner: FC<any> = () => {
  const context: any = useContext(SpinnerContext);

  if (context?.spinner) {
    return ReactDOM.createPortal(
      <>
        <div
          className={`${context?.spinnerRootId == "spinner-root" ? "spinner-backdrop" : "floating-spinner-backdrop"
            } `}></div>
        <div className="spinner-container text-white">
          <img alt="" src={spinnerSvg} className="spinner" />
          <div>{context?.spinnerContent}</div>
        </div>
      </>,
      document.getElementById(context?.spinnerRootId)!
    );
  } else return null;
};

export default Spinner;
