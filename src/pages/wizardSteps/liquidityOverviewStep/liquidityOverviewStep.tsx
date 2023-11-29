/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { flowTypes, liquidityFlowSteps } from "../../../services/redux/wizardStatusSlice";
import uniswapLogo from "./../../../assets/logos/uniswap.svg";
import zenonLogo from "./../../../assets/logos/zenon.svg";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const LiquidityOverviewStep: FC<{
  onStepSubmit?: (flow: string, step?: number) => void;
}> = ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onStepSubmit = () => { },
}) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
    } = useForm();

    const [userOwnsTokens, setUserOwnsTokens] = useState(false);
    const [userAddedLiquidity, setUserAddedLiquidity] = useState(false);
    const [userSwappedToZts, setUserSwappedToZts] = useState(false);
    const globalConstants = useSelector((state: any) => state.globalConstants);

    const goToUniswap = () => {
      console.log("goToUniswap");
      onStepSubmit(flowTypes.LiquidityStaking, liquidityFlowSteps.AddLiquidity);
      console.log("onStepSubmit");
    };

    const goToBridge = () => {
      console.log("goToBridge");
      onStepSubmit(flowTypes.Swap);
    };

    const onFormSubmit = () => {
      onStepSubmit(flowTypes.LiquidityStaking, liquidityFlowSteps.Staking);
    };

    return (
      <div className="pl-3 pr-3">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="mt-5 text-left custom-checkbox-container">
            <label className="custom-checkbox d-flex align-items-center" htmlFor={"userOwnsTokens"}>
              <input
                className="mr-3 custom-checkbox"
                id={"userOwnsTokens"}
                type="checkbox"
                {...register("userOwnsTokens", { required: true })}
                onChange={(e) => {
                  setUserOwnsTokens(e.target.checked);
                  setValue("userOwnsTokens", e.target.checked, { shouldValidate: true });
                }}></input>
              <span
                className={`custom-checkmark ${errors["userOwnsTokens"] ? "custom-label-checkbox-error" : ""}`}
                style={{ top: "unset" }}></span>
              <span className={`${errors["userOwnsTokens"] ? "custom-label-text-error" : ""}`}>
                I understand that I must have enough wZNN and ETH in order to add liquidity and pay for Ethereum gas fees.
              </span>
            </label>
          </div>

          <div
            className={`extension-item mt-5 dark-shadow-on-hover cursor-pointer tooltip ${userOwnsTokens ? "" : "disabled"
              }`}
            onClick={() => goToUniswap()}>
            <div className={`step-counter ${userAddedLiquidity ? "completed" : ""}`}>{1}</div>
            <div className="step-content text-center">
              {userAddedLiquidity ? <>Added Liquidity via Uniswap Pool</> : <>Add Liquidity via Uniswap Pool</>}
            </div>
            <img
              alt="step-logo"
              className="step-logo extension-logo"
              style={{ maxWidth: "100px", maxHeight: "100px" }}
              src={uniswapLogo}></img>
            <span className="tooltip-text">Click to go to the Add Liquidity section</span>
          </div>

          <div className="d-flex align-items-center mt-5">
            <div className=" text-left custom-checkbox-container">
              <label
                className={`pt-3 pb-3 custom-checkbox ${userOwnsTokens ? "" : "disabled"}`}
                htmlFor={"addedLiquidity"}>
                <input
                  className="mr-3 custom-checkbox"
                  id={"addedLiquidity"}
                  type="checkbox"
                  {...register("addedLiquidity", { required: true })}
                  onChange={(e) => {
                    setUserAddedLiquidity(e.target.checked);
                    setValue("addedLiquidity", e.target.checked, { shouldValidate: true });
                  }}></input>
                <span
                  className={`custom-checkmark ${errors["addedLiquidity"] ? "custom-label-checkbox-error" : ""}`}></span>
                <span className={`${errors["addedLiquidity"] ? "custom-label-text-error" : ""}`}>
                  {`I added liquidity via `}
                </span>
                <a
                  className="tooltip uniswap-pool-link"
                  href={globalConstants.uniswapPoolLink}
                  target="_blank"
                  rel="noreferrer">
                  <b>Uniswap Pool</b>
                  <span className="tooltip-text">Go to Uniswap pool</span>
                </a>
                <span className={`${errors["addedLiquidity"] ? "custom-label-text-error" : ""}`}>{` in step 1`}</span>
              </label>
            </div>
          </div>

          <div
            className={`extension-item mt-5 dark-shadow-on-hover cursor-pointer tooltip ${userAddedLiquidity ? "" : "disabled"
              }`}
            onClick={() => goToBridge()}>
            <div className={`step-counter ${userSwappedToZts ? "completed" : ""}`}>{2}</div>
            <div className="step-content text-center">
              {userSwappedToZts ? <>Bridged liquidity to Zenon</> : <>Bridge liquidity to Zenon</>}
            </div>
            <img
              alt="step-logo"
              className="step-logo extension-logo"
              style={{ maxWidth: "100px", maxHeight: "100px" }}
              src={zenonLogo}></img>
            <span className="tooltip-text">Click to go to swap section of the bridge</span>
          </div>

          <div className="mt-5 text-left custom-checkbox-container">
            <label
              className={`pt-3 pb-3 custom-checkbox ${userAddedLiquidity ? "" : "disabled"}`}
              htmlFor={"swappedToZts"}>
              <input
                className="mr-3 custom-checkbox"
                id={"swappedToZts"}
                type="checkbox"
                {...register("swappedToZts", { required: true })}
                onChange={(e) => {
                  setUserSwappedToZts(e.target.checked);
                  setValue("swappedToZts", e.target.checked, { shouldValidate: true });
                }}></input>
              <span className={`custom-checkmark ${errors["swappedToZts"] ? "custom-label-checkbox-error" : ""}`}></span>
              <span className={`${errors["swappedToZts"] ? "custom-label-text-error" : ""}`}>
                I bridged my liquidity to Zenon in step 2
              </span>
            </label>
          </div>

          <div
            className={`step-content mt-5 pt-3 ${Object.keys(errors).length || !userOwnsTokens || !userSwappedToZts || !userAddedLiquidity ? "disabled" : ""
              }`}>
            <div className={`button primary text-white `}>
              Go to Liquidity Staking
              <input className="ghost-over cursor-pointer" type="submit" name="submitButton"></input>
            </div>
          </div>
        </form>
      </div>
    );
  };

export default LiquidityOverviewStep;
