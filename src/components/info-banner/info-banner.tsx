import { FC } from "react";
import { useSelector } from "react-redux";
import "../../utils/constants";
import "./info-banner.scss";

const InfoBanner: FC = () => {
  const globalConstants = useSelector((state: any) => state.globalConstants);

  return (
    <div className="info-banner">
      <>{`Bookmark ${globalConstants.officialBridgeCommunityUrl} and beware of scams!`}</>
    </div>
  );
};

export default InfoBanner;
