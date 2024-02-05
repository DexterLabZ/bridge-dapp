import {useContext} from "react";
import {InternalNetworkContext} from "./internalNetworkContext";

export default () => {
  const internalNetworkClient = useContext(InternalNetworkContext);

  return {internalNetworkClient};
};
