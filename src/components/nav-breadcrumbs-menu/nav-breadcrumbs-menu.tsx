import JSONbig from "json-bigint";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  flowTypes,
  liquidityFlowSteps,
  stepsDisplayNames,
  storeCurrentFlowType,
  storeCurrentWizardFlowStep,
  swapFlowSteps,
} from "../../services/redux/wizardStatusSlice";
import BurgerIcon from "../animated-icons/burger-icon/burger-icon";
import NavBreadcrumbsButton from "../nav-breadcrumbs-button/nav-breadcrumbs-button";
import "./nav-breadcrumbs-menu.scss";

const NavBreadcrumbsMenu: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const wizardStatus = useSelector((state: any) => state.wizardStatus);
  const dispatch = useDispatch();
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const [zenonAddress, setZenonAddress] = useState("");
  const [ercAddress, setErcAddress] = useState("");

  useEffect(() => {
    console.log("serializedWalletInfo", serializedWalletInfo);
    if (serializedWalletInfo["zenonInfo"]) {
      console.log(JSONbig.parse(serializedWalletInfo["zenonInfo"]));
      setZenonAddress(JSONbig.parse(serializedWalletInfo["zenonInfo"])?.address);
    } else {
      setZenonAddress("");
    }
    if (serializedWalletInfo["ercInfo"]) {
      console.log(JSONbig.parse(serializedWalletInfo["ercInfo"]));
      setErcAddress(JSONbig.parse(serializedWalletInfo["ercInfo"])?.address);
    } else {
      setErcAddress("");
    }
  }, [serializedWalletInfo]);

  const goToStep = (step: number) => {
    console.log("Changing current steps", step);
    console.log("Changing current flow", wizardStatus.metaFlowType);
    if (wizardStatus.metaFlowType == flowTypes.LiquidityStaking) {
      // Changing current flow
      if (step == liquidityFlowSteps.Bridge) {
        // Only change flowType if user clicks on Bridge nav button
        dispatch(storeCurrentFlowType(flowTypes.Swap));
        dispatch(storeCurrentWizardFlowStep(swapFlowSteps.Swap));
      } else {
        // Else make sure we are staying on the current flow (liquidityStaking)
        dispatch(storeCurrentFlowType(flowTypes.LiquidityStaking));
        dispatch(storeCurrentWizardFlowStep(step));
      }
    } else {
      dispatch(storeCurrentWizardFlowStep(step));
    }
  };

  const getFlowStepsEnum = (currentFlowType: flowTypes) => {
    if (currentFlowType == flowTypes.Swap) return swapFlowSteps;
    else return liquidityFlowSteps;
  };

  const shouldDisableStep = (questionableStepIndex: number) => {
    const currentStepIndex = wizardStatus.currentFlowStep;
    const flowStepsEnum = getFlowStepsEnum(wizardStatus.currentFlowType);

    const alwaysDisabledSteps = [
      liquidityFlowSteps.Agreement,
      liquidityFlowSteps.Success,
      swapFlowSteps.Agreement,
      swapFlowSteps.Success,
    ];
    const dynamicallyDisabled: string[] = [];

    // Restrict user from going anywhere else if he hasn't approved the agreements
    if (currentStepIndex <= flowStepsEnum["Agreement"]) {
      if (questionableStepIndex > flowStepsEnum["Agreement"]) return true;
    }

    if (!(zenonAddress?.length && ercAddress?.length)) {
      // User doesn't have both extensions connected
      if (questionableStepIndex > flowStepsEnum["Agreement"]) return true;
    }

    const disabledSteps = [...alwaysDisabledSteps, ...dynamicallyDisabled];

    if (disabledSteps.includes(questionableStepIndex)) return true;

    return false;
  };

  return (
    <div className="nav-menu-bar-container">
      {wizardStatus.currentFlowStep !== 0 && (
        <>
          <div className={`${isMobileMenuOpen ? "burger-menu-container" : "nav-breadcrumbs-container"}`}>
            {wizardStatus.currentFlowStep !== 0 && (
              <div className="flow-name text-gray text-sm">
                {wizardStatus.metaFlowType === flowTypes.LiquidityStaking ? (
                  `Liquidity staking flow`
                ) : (
                  <>{`Bridge flow`}</>
                )}
              </div>
            )}
            <div className={`${isMobileMenuOpen ? "mobile-menu mobile-active" : ""}`}>
              {Object.values(getFlowStepsEnum(wizardStatus.metaFlowType))
                .filter((v) => !isNaN(Number(v)))
                // This filters so steps are only numbers
                .map((step: any, index: number) => {
                  // Check if the current flow is a meta flow and if the current step is part of the swap flow
                  if (
                    wizardStatus.metaFlowType === flowTypes.LiquidityStaking &&
                    wizardStatus.currentFlowType === flowTypes.Swap
                  ) {
                    if (wizardStatus.currentFlowStep === swapFlowSteps.Requests) {
                      return (
                        <NavBreadcrumbsButton
                          key={"breadcrumbs-menu-key" + wizardStatus.metaFlowType + "-" + step}
                          stepIndex={index + 1}
                          uniqueKey={"breadcrumbs-menu-key" + wizardStatus.metaFlowType + "-" + step}
                          content={
                            (stepsDisplayNames as any)?.[wizardStatus.metaFlowType]?.[
                              getFlowStepsEnum(wizardStatus.metaFlowType)[step]
                            ]
                          }
                          link=""
                          isCompleted={liquidityFlowSteps.BridgeHistory >= step}
                          isActive={liquidityFlowSteps.BridgeHistory == step}
                          isDisabled={shouldDisableStep(step)}
                          onClick={() => goToStep(step)}></NavBreadcrumbsButton>
                      );
                    } else {
                      return (
                        <NavBreadcrumbsButton
                          key={"breadcrumbs-menu-key" + wizardStatus.metaFlowType + "-" + step}
                          stepIndex={index + 1}
                          uniqueKey={"breadcrumbs-menu-key" + wizardStatus.metaFlowType + "-" + step}
                          content={
                            (stepsDisplayNames as any)?.[wizardStatus.metaFlowType]?.[
                              getFlowStepsEnum(wizardStatus.metaFlowType)[step]
                            ]
                          }
                          link=""
                          isCompleted={liquidityFlowSteps.Bridge >= step}
                          isActive={liquidityFlowSteps.Bridge == step}
                          isDisabled={shouldDisableStep(step)}
                          onClick={() => goToStep(step)}></NavBreadcrumbsButton>
                      );
                    }
                  }

                  return (
                    <NavBreadcrumbsButton
                      key={"breadcrumbs-menu-key" + wizardStatus.currentFlowType + "-" + step}
                      stepIndex={index + 1}
                      uniqueKey={"breadcrumbs-menu-key" + wizardStatus.currentFlowType + "-" + step}
                      content={
                        (stepsDisplayNames as any)?.[wizardStatus.currentFlowType]?.[
                          getFlowStepsEnum(wizardStatus.currentFlowType)[step]
                        ]
                      }
                      link=""
                      isCompleted={wizardStatus.currentFlowStep >= step}
                      isActive={wizardStatus.currentFlowStep == step}
                      isDisabled={shouldDisableStep(step)}
                      onClick={() => goToStep(step)}></NavBreadcrumbsButton>
                  );
                })}
            </div>
          </div>

          <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="burger-menu-container">
            <div className={`burger-button animate-on-hover ${isMobileMenuOpen ? "burger-opened" : ""}`}>
              <BurgerIcon />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NavBreadcrumbsMenu;
