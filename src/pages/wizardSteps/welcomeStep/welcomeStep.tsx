import { useSelector } from "react-redux";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const WelcomeStep = ({ onStepSubmit = (where: string) => {} }) => {
  const storedConstants = useSelector((state: any) => state.globalConstants);

  return (
    <div className="mt-4 w-100">
      <h1 className="text-center"> Welcome, alien 👽🖖 </h1>
      <h2 className="w-100 text-center mb-5">What do you want to do?</h2>

      <div className="d-flex w-100 justify-content-around mt-5 mb-4">
        <div className={`button primary text-white flex-1 mr-3 ml-5`} onClick={() => onStepSubmit("swap")}>
          Bridge Tokens
        </div>
        {!storedConstants.isSupernovaNetwork ? (
          <div className={`button accent text-white flex-1 mr-5 ml-3`} onClick={() => onStepSubmit("liquidityStaking")}>
            Liquidity Staking
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default WelcomeStep;
