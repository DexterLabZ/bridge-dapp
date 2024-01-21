import { useContext } from "react";
import { ExternalNetworkContext } from "./externalNetworkContext";

export default () => {
  const externalNetworkClient = useContext(ExternalNetworkContext);

  return { externalNetworkClient };
};
