import { FC, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { liquidityFlowSteps, storeCurrentWizardFlowStep, swapFlowSteps } from "../../services/redux/wizardStatusSlice";
import BurgerIcon from "../animated-icons/burger-icon/burger-icon";
import NavMenuButton from "../nav-menu-button/nav-menu-button";
import homeSvg from "./../../assets/icons/home.svg";
import requestsListSvg from "./../../assets/icons/list.svg";
import newSwapSvg from "./../../assets/icons/swap.svg";
import "./nav-menu-bar.scss";

const NavMenuBar: FC = () => {
  const newSwapIcon = <img alt="" className="" height="15px" src={newSwapSvg} />;
  const requestsListIcon = <img alt="" className="" height="15px" src={requestsListSvg} />;
  const homeIcon = <img alt="" className="" height="15px" src={homeSvg} />;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const wizardStatus = useSelector((state: any) => state.wizardStatus);
  const dispatch = useDispatch();

  const goToStep = (step: number) => {
    dispatch(storeCurrentWizardFlowStep(step));
  };

  return (
    <div className="nav-menu-bar-container">
      {wizardStatus.currentFlowStep !== 0 && (
        <>
          <div className="nav-buttons-container">
            {wizardStatus.currentFlowStep !== 0 && (
              <span onClick={() => goToStep(swapFlowSteps.Home)} tabIndex={0}>
                <NavMenuButton content="Home" link="" isActive={false} icon={homeIcon}></NavMenuButton>
              </span>
            )}

            {[swapFlowSteps.Requests, swapFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
              <span onClick={() => goToStep(swapFlowSteps.Swap)} tabIndex={0}>
                <NavMenuButton content="New swap" link="" isActive={false} icon={newSwapIcon}></NavMenuButton>
              </span>
            )}

            {[swapFlowSteps.Swap, swapFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
              <span onClick={() => goToStep(swapFlowSteps.Requests)} tabIndex={0}>
                <NavMenuButton content="All swaps" link="" isActive={false} icon={requestsListIcon}></NavMenuButton>
              </span>
            )}

            {[liquidityFlowSteps.Staking, liquidityFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
              <span onClick={() => goToStep(liquidityFlowSteps.StakingHistory)} tabIndex={0}>
                <NavMenuButton
                  content="Staking rewards"
                  link=""
                  isActive={false}
                  icon={requestsListIcon}></NavMenuButton>
              </span>
            )}

            {[liquidityFlowSteps.StakingHistory, liquidityFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
              <span onClick={() => goToStep(liquidityFlowSteps.Staking)} tabIndex={0}>
                <NavMenuButton content="Stake liquidity" link="" isActive={false} icon={newSwapIcon}></NavMenuButton>
              </span>
            )}
          </div>

          <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="burger-menu-container">
            <div className={`burger-button animate-on-hover ${isMobileMenuOpen ? "burger-opened" : ""}`}>
              <BurgerIcon />
            </div>
            <div className={`mobile-menu ${isMobileMenuOpen ? "mobile-active" : ""}`}>
              {wizardStatus.currentFlowStep !== 0 && (
                <span onClick={() => goToStep(0)} tabIndex={0}>
                  <NavMenuButton content="Home" link="" isActive={false} icon={homeIcon}></NavMenuButton>
                </span>
              )}

              {[swapFlowSteps.Requests, swapFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
                <span onClick={() => goToStep(2)} tabIndex={0}>
                  <NavMenuButton content="New swap" link="" isActive={false} icon={newSwapIcon}></NavMenuButton>
                </span>
              )}

              {[swapFlowSteps.Swap, swapFlowSteps.Success].includes(wizardStatus.currentFlowStep) && (
                <span onClick={() => goToStep(3)} tabIndex={0}>
                  <NavMenuButton content="All swaps" link="" isActive={false} icon={requestsListIcon}></NavMenuButton>
                </span>
              )}

              {[11, 16].includes(wizardStatus.currentFlowStep) && (
                <span onClick={() => goToStep(15)} tabIndex={0}>
                  <NavMenuButton
                    content="Liquidity Staking"
                    link=""
                    isActive={false}
                    icon={newSwapIcon}></NavMenuButton>
                </span>
              )}

              {[15, 16].includes(wizardStatus.currentFlowStep) && (
                <span onClick={() => goToStep(14)} tabIndex={0}>
                  <NavMenuButton
                    content="Liquidity Staking"
                    link=""
                    isActive={false}
                    icon={requestsListIcon}></NavMenuButton>
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NavMenuBar;
