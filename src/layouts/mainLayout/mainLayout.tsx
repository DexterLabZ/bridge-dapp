import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomCursor from "../../components/custom-cursor/custom-cursor";
import InfoBanner from "../../components/info-banner/info-banner";
import NavBreadcrumbsMenu from "../../components/nav-breadcrumbs-menu/nav-breadcrumbs-menu";
import NetworkDetails from "../../components/network-details/network-details";
import ReferralCodeInterpreter from "../../components/referralCodeInterpreter/referralCodeInterpreter";
import WalletDetails from "../../components/wallet-details/wallet-details";
import { SpinnerProvider } from "../../services/hooks/spinner/spinnerContext";
import { InternalNetworkProvider } from "../../services/hooks/internalNetwork-provider/internalNetworkContext";
import { ExternalNetworkProvider } from "../../services/hooks/externalNetwork-provider/externalNetworkContext";
import { addBeforeUnloadEvents, removeBeforeUnloadEvents } from "../../services/pageHandlers/pageHandlers";
import WizardLayout from "../wizardLayout/wizardLayout";
import swirl from "./../../assets/swirl.svg";
import "./mainLayout.scss";

/**
 * * GTM SERVICE
 */
import { useSelector } from "react-redux";

import { GTMProvider } from "@elgorditosalsero/react-gtm-hook";

const MainLayout = () => {
  /**
   * * GTM SERVICE
   * @param { id: 'GTM-ID' }
   */
  const globalConstants = useSelector((state: any) => state.globalConstants);

  const gtmParams = { id: globalConstants.GTM_ID };

  useEffect(() => {
    addBeforeUnloadEvents();
    return () => {
      removeBeforeUnloadEvents();
    };
  });

  return (
    <div className="main-layout">
      <GTMProvider state={gtmParams}>
        <SpinnerProvider>
          <InternalNetworkProvider>
            <ExternalNetworkProvider>
              <NavBreadcrumbsMenu />
              <div className="bg-shapes-container">
                <img alt="bg-shapes" className="bg-shapes" src={require("./../../assets/bg-shapes.png")}></img>
                <img alt="bg-swirl" className="bg-swirl" src={swirl}></img>
              </div>
              <CustomCursor></CustomCursor>
              <div className="responsive-container">
                <WizardLayout />
                <ToastContainer />
                <InfoBanner />
                <WalletDetails />
                <NetworkDetails />
                <ReferralCodeInterpreter />
              </div>
            </ExternalNetworkProvider>
          </InternalNetworkProvider>
        </SpinnerProvider>
        <div id="spinner-root"></div>
      </GTMProvider>
    </div>
  );
};

export default MainLayout;
function alertUser(this: Window, ev: BeforeUnloadEvent) {
  throw new Error("Function not implemented.");
}
