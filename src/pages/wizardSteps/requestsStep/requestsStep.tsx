import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import UnwrapRequestsList from "../unwrapRequestsList/unwrapRequestsList";
import WrapRequestsList from "../wrapRequestsList/wrapRequestsList";
import "./requestsStep.scss";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const RequestsStep = ({ onStepSubmit = () => { } }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const storedRequests = useSelector((state: any) => state.requests);

  useEffect(() => {
    setTimeout(() => {
      const activeWrapRequest = JSON.parse(storedRequests.activeWrapRequest || "{}");
      const activeUnwrapRequest = JSON.parse(storedRequests.activeUnwrapRequest || "{}");
      console.log("activeWrapRequest", activeWrapRequest);
      console.log("activeUnwrapRequest", activeUnwrapRequest);

      if (activeUnwrapRequest?.timestamp != -1) {
        setActiveTab(1);
      }
      if (activeWrapRequest?.timestamp != -1) {
        setActiveTab(0);
      }
    }, 500);
  }, [storedRequests]);

  return (
    <div className="mt-4">
      <div className="tabs-container">
        <div className="tabs-header">
          <div
            className={`tab-button ${activeTab == 0 ? "active" : "dark-shadow-on-hover"}`}
            onClick={() => setActiveTab(0)}>
            <span>Wrap Requests</span>
          </div>
          <div
            className={`tab-button ${activeTab == 1 ? "active" : "dark-shadow-on-hover"}`}
            onClick={() => setActiveTab(1)}>
            <span>Unwrap Requests</span>
          </div>
        </div>
        <div className="tabs-content">
          {activeTab == 0 && (
            <div className="tab-content">
              <WrapRequestsList onStepSubmit={onStepSubmit} />
            </div>
          )}
          {activeTab == 1 && (
            <div className="tab-content">
              <div className="mt-4">
                <UnwrapRequestsList onStepSubmit={onStepSubmit} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsStep;
