/* eslint-disable @typescript-eslint/no-empty-function */
import { FC } from "react";
import "./nav-breadcrumbs-button.scss";

const NavBreadcrumbsButton: FC<{
  content: string;
  link: string;
  isActive?: boolean;
  isDisabled?: boolean;
  isCompleted?: boolean;
  icon?: any;
  uniqueKey?: string;
  stepIndex?: number;
  onClick?: () => void;
}> = ({
  content,
  link,
  isActive = false,
  isDisabled = false,
  isCompleted = false,
  icon = {},
  onClick = () => { },
  uniqueKey = "default-key",
  stepIndex,
}) => {
    return (
      <div
        key={uniqueKey}
        className={`nav-breadcrumbs-button-container animate-on-hover ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""
          }`}
        tabIndex={0}>
        <div
          className={`nav-breadcrumbs-button primary-shadow-on-hover ${isDisabled ? "disabled" : ""}`}
          onClick={onClick}>
          <div className="show-on-smaller-screens">
            <div className="tooltip d-flex align-items-center">
              {stepIndex ? <>{`${stepIndex}.`}</> : <></>}
              <div className="tooltip-text ml-5 mt-5">{content}</div>
            </div>
          </div>
          
          <div className="show-on-bigger-screens">{content}</div>
        </div>
      </div>
    );
  };

export default NavBreadcrumbsButton;
