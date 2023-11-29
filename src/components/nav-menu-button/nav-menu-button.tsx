import { FC } from "react";
import "./nav-menu-button.scss";

const NavMenuButton: FC<{ content: string; link: string; isActive: boolean; icon: any }> = ({
  content,
  link,
  isActive,
  icon = {},
}) => {
  return (
    <div className={`nav-menu-button-container animate-on-hover ${isActive ? "active" : ""}`} tabIndex={0}>
      <div className={`nav-menu-button primary-shadow-on-hover`}>
        <span className="mr-1">{icon}</span>
        {content}
      </div>
    </div>
  );
};

export default NavMenuButton;
