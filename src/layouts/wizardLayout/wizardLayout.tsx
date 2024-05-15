import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddLiquidityStep from "../../pages/wizardSteps/addLiquidityStep/addLiquidityStep";
import AgreementStep from "../../pages/wizardSteps/agreementStep/agreementStep";
import ExtensionConnect from "../../pages/wizardSteps/extensionConnect/extensionConnect";
import LiquidityOverviewStep from "../../pages/wizardSteps/liquidityOverviewStep/liquidityOverviewStep";
import LiquidityStakingHistoryStep from "../../pages/wizardSteps/liquidityStakingHistoryStep/liquidityStakingHistoryStep";
import LiquidityStakingStep from "../../pages/wizardSteps/liquidityStakingStep/liquidityStakingStep";
import LiquidityStakingSuccessStep from "../../pages/wizardSteps/liquidityStakingSuccessStep/liquidityStakingSuccessStep";
import RequestsStep from "../../pages/wizardSteps/requestsStep/requestsStep";
import SwapStep from "../../pages/wizardSteps/swapStep/swapStep";
import SwapSuccessStep from "../../pages/wizardSteps/swapSuccessStep/swapSuccessStep";
import WelcomeStep from "../../pages/wizardSteps/welcomeStep/welcomeStep";
import {
  flowTypes,
  liquidityFlowSteps,
  storeCurrentFlowType,
  storeCurrentWizardFlowStep,
  storeMetaFlowType,
  swapFlowSteps,
} from "../../services/redux/wizardStatusSlice";
import "./wizardLayout.scss";

const WizardLayout = () => {
  const wizardStatus = useSelector((state: any) => state.wizardStatus);
  const dispatch = useDispatch();
  const [currentFlowStep, setCurrentFlowStep] = useState(wizardStatus.currentFlowStep);
  const globalConstants = useSelector((state: any) => state.globalConstants);

  useEffect(() => {
    console.log("Step changed from", currentFlowStep, "to", wizardStatus.currentFlowStep);
    setCurrentFlowStep(wizardStatus.currentFlowStep);
  }, [wizardStatus.currentFlowStep]);

  useEffect(() => {
    console.log("Step changed from", currentFlowStep, "to", wizardStatus.currentFlowStep);
    dispatch(storeCurrentWizardFlowStep(currentFlowStep));
  }, [currentFlowStep]);

  const goToStep = (step: number) => {
    setCurrentFlowStep(step);
    dispatch(storeCurrentWizardFlowStep(step));
  };

  const nextStep = async () => {
    setCurrentFlowStep(currentFlowStep + 1);
  };

  const welcomeStepSubmit = (where: string) => {
    if (where == flowTypes.LiquidityStaking) {
      goToStep(liquidityFlowSteps.Agreement);
      dispatch(storeCurrentFlowType(flowTypes.LiquidityStaking));
      dispatch(storeMetaFlowType(flowTypes.LiquidityStaking));
    } else {
      if (where == flowTypes.Swap) {
        goToStep(swapFlowSteps.Agreement);
        dispatch(storeCurrentFlowType(flowTypes.Swap));
        dispatch(storeMetaFlowType(flowTypes.Swap));
      }
    }
    console.log("Extension connect step completed");
  };

  const agreementStepSubmit = () => {
    console.log("Agreement step completed");
    nextStep();
  };

  const extensionConnectStepSubmit = (where: string) => {
    if (where == "existing") {
      goToStep(swapFlowSteps.Requests);
    } else {
      nextStep();
    }
    console.log("Extension connect step completed");
  };

  const swapInitiated = () => {
    console.log("swapInitiated");
    nextStep();
  };

  const requestSelected = () => {
    console.log("requestSelected");
    nextStep();
  };

  const successConfirmed = () => {
    console.log("successConfirmed");
    if (wizardStatus.metaFlowType == flowTypes.LiquidityStaking) {
      goToStep(liquidityFlowSteps.Staking);
      dispatch(storeCurrentFlowType(flowTypes.LiquidityStaking));
    } else {
      goToStep(swapFlowSteps.Swap);
    }
  };

  const stakingSuccess = () => {
    console.log("Staking initiated");
    nextStep();
  };

  const liquidityExtensionConnectStepSubmit = (where: string) => {
    nextStep();
    console.log("Extension connect step completed");
  };

  const overviewStepSubmit = (flow: string, step?: number) => {
    if (flow == flowTypes.LiquidityStaking) {
      goToStep(step || liquidityFlowSteps.AddLiquidity);
      dispatch(storeCurrentFlowType(flowTypes.LiquidityStaking));
    } else {
      if (flow == flowTypes.Swap) {
        goToStep(step || swapFlowSteps.Swap);
        dispatch(storeCurrentFlowType(flowTypes.Swap));
      }
      console.log("overviewStepSubmit step completed");
    }
  };

  const addLiquidityStepSubmit = () => {
    // After Liquidity go to Bridge step by default and change the currentFlowType but keep the metaFlowType
    dispatch(storeCurrentFlowType(flowTypes.Swap));
    dispatch(storeCurrentWizardFlowStep(swapFlowSteps.Swap));
    goToStep(swapFlowSteps.Swap);

    console.log("addLiquidityStepSubmit step completed");
  };

  return (
    <div className="wizard-container">
      <div className="container-header">
        <div className="logo-container">
          {globalConstants?.isSupernovaNetwork ? (
            <>
              <div className="supernova-logo-font logo-white-part">Supernova</div>
              <div className="supernova-logo-font logo-green-part">Extension-chain</div>
            </>
          ) : (
            <>
              <div className="logo-white-part">NoM</div>
              <div className="logo-green-part">Multichain</div>
            </>
          )}
        </div>
      </div>
      <div id="extension-approval-spinner-root" className="wizard-content">
        {currentFlowStep === swapFlowSteps.Home && <WelcomeStep onStepSubmit={welcomeStepSubmit} />}

        {currentFlowStep === swapFlowSteps.Agreement && <AgreementStep onStepSubmit={agreementStepSubmit} />}

        {currentFlowStep === swapFlowSteps.ExtensionConnect && (
          <div className="w-100">
            <ExtensionConnect onStepSubmit={extensionConnectStepSubmit} />
          </div>
        )}

        {currentFlowStep === swapFlowSteps.Swap && (
          <div className="w-100">
            <SwapStep onStepSubmit={swapInitiated} />
          </div>
        )}

        {currentFlowStep === swapFlowSteps.Requests && (
          <div className="w-100">
            <RequestsStep onStepSubmit={requestSelected} />
          </div>
        )}

        {currentFlowStep === swapFlowSteps.Success && (
          <div className="w-100">
            <SwapSuccessStep onStepSubmit={successConfirmed} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.Agreement && (
          <div className="w-100">
            <AgreementStep onStepSubmit={agreementStepSubmit} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.ExtensionConnect && (
          <div className="w-100">
            <ExtensionConnect onStepSubmit={liquidityExtensionConnectStepSubmit} isLiquidityFlow={true} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.Overview && (
          <div className="w-100">
            <LiquidityOverviewStep onStepSubmit={overviewStepSubmit} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.AddLiquidity && (
          <div className="w-100">
            <AddLiquidityStep onStepSubmit={addLiquidityStepSubmit} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.Bridge && (
          <div className="w-100">
            <SwapStep onStepSubmit={swapInitiated} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.BridgeHistory && (
          <div className="w-100">
            <RequestsStep onStepSubmit={requestSelected} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.Staking && (
          <div className="w-100">
            <LiquidityStakingStep onStepSubmit={stakingSuccess} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.Success && (
          <div className="w-100">
            <LiquidityStakingSuccessStep onStepSubmit={nextStep} />
          </div>
        )}

        {currentFlowStep === liquidityFlowSteps.StakingHistory && (
          <div className="w-100">
            <LiquidityStakingHistoryStep onStepSubmit={nextStep} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WizardLayout;
