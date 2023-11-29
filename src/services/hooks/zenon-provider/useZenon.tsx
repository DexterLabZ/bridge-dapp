import { useContext } from "react";
import { ZenonContext } from "./zenonContext";

export default () => {
  const zenonClient = useContext(ZenonContext);

  return { zenonClient };
};
