import { WalletConnectModal } from "@walletconnect/modal";
import Client, { SignClient } from "@walletconnect/sign-client";
import { PairingTypes, SessionTypes } from "@walletconnect/types";
import { toast } from "react-toastify";
import { Primitives } from "znn-ts-sdk";
import constants from "../../../utils/constants";
import syriusLogo from "./../../../assets/logos/syrius-logo-padded.svg";
import logoIcon from "./../../../assets/logos/zenon-big.png";

const walletConnectProjectId = "6106aa8c2f308b338f31465bef999a1f";

const desktopWallets = [
  {
    id: "syrius",
    name: "Syrius",
    links: {
      native: "syrius:",
      universal: constants.officialSyriusWalletUrl,
    },
  },
];

const walletImages = {
  syrius: syriusLogo,
};
const zenonNamespace = {
  zenon: {
    id: "syrius",
    chains: ["zenon:1"],
    methods: ["znn_sign", "znn_info", "znn_send"],
    events: ["chainIdChange", "addressChange"],
  },
};

const themeVariables = {
  "--wcm-font-family": `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
  "--wcm-background-color": "#26BA3F",
  "--wcm-accent-color": "#67E646",
  "--wcm-button-border-radius	": "8px",
  "--wcm-wallet-icon-border-radius": "8px",
  "--wcm-secondary-button-border-radius": "8px",
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const init = async () => {
  const signClient = await SignClient.init({
    projectId: walletConnectProjectId,
    metadata: {
      // name: document.title,
      // description: (document.querySelector('meta[name="description"]') as any)?.content,
      name: "NoM Multichain",
      description: "Bridge tokens, add and stake liquidity",
      url: window.location.host,
      icons: [window.location.origin + logoIcon],
    },
  });
  return signClient;
};

const connect = async (signClient: Client, onModalClose?: (reason: { [key: string]: any }) => unknown) => {
  console.log("Connecting wallet");

  const wcModal: any = new WalletConnectModal({
    // walletConnectVersion: 2,
    projectId: walletConnectProjectId,
    chains: ["zenon:1"],
    themeVariables: themeVariables,
    mobileWallets: [],
    // mobileWallets: mobileWallets,
    // desktopWallets: [],
    desktopWallets: desktopWallets,
    walletImages: walletImages,
    explorerRecommendedWalletIds: "NONE",
    enableExplorer: false,
    themeMode: "light",
  });

  wcModal.subscribeModal((state: any) => console.log("wcModal.subscribeModal", state));

  const latestPairing = getLatestActivePairing(signClient);
  //
  // First step is to find out if we are already paired with a Wallet
  //
  if (latestPairing) {
    //
    // If we are paired we search for an available session.
    // Sessions can expire and we need to make sure they are still available
    //
    const latestSession = getLatestActiveSession(signClient);
    if (latestSession) {
      //
      //  Old Pairing, Old Session
      //
      console.log("[CONNECTED] Found pairing and session. Already connected on ", latestPairing, latestSession);
      return { session: latestSession, pairing: latestPairing };
    } else {
      //
      //  Old Pairing, New Session
      //
      console.log("[CONNECTED] Creating new session on pairing", latestPairing);

      await signClient.connect({
        pairingTopic: latestPairing.topic,
        requiredNamespaces: zenonNamespace,
      });

      // We usually get some errors if not adding this delay. Sessions were not updated as soon as the await finished
      await delay(5000);

      const newSession = getLatestActiveSession(signClient);
      console.log("[CONNECTED] New session", newSession);
      return { session: newSession, pairing: latestPairing };
    }
  } else {
    //
    // New Pairing, New Pairing
    //
    console.log("[CONNECTED] Creating new pairing and session");
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: zenonNamespace,
    });
    console.log("Generated URI", uri);
    if (uri) {
      try {
        await wcModal.openModal({ uri });
        wcModal.subscribeModal((state: any) => {
          if (state.open == false) {
            console.log("state", state);
            if (onModalClose) {
              onModalClose({ message: "User closed modal" });
            }
          }
        });

        const session = await approval();
        console.log("[CONNECTED] Session", session);

        // We usually get some errors if not adding the delay.
        // The new pairings are not in the list as soon as the await finishes
        await delay(5000);

        wcModal.closeModal();
        const newPairing = getLatestActivePairing(signClient);
        console.log("[CONNECTED] newPairing", newPairing);
        return { session: session, pairing: newPairing };
      } catch (err) {
        console.error("Error approving", err);
        wcModal.closeModal();
        throw err;
      }
    } else {
      throw Error("Couldn't generate URI on new session or topic");
    }
  }
};

const getLatestActivePairing = (signClient: Client) => {
  const allPairings = signClient.pairing.getAll();
  console.log("allPairings", allPairings);

  const activePairings = allPairings.filter((p) => p.active);
  console.log("activePairings", activePairings);

  const latestPairingIndex = activePairings.length - 1;
  const latestPairing = activePairings[latestPairingIndex];
  console.log("latestPairing", latestPairing);

  return latestPairing;
};

const getLatestActiveSession = (signClient: Client) => {
  const filteredSessions = signClient.find({
    requiredNamespaces: zenonNamespace,
  });

  const activeSessions = filteredSessions.filter((s) => s.expiry > Date.now() / 1000);
  console.log("activeSessions", activeSessions);

  const latestSessionIndex = activeSessions.length - 1;
  const latestSession = activeSessions[latestSessionIndex];
  console.log("latestSession", latestSession);

  return latestSession;
};

const getInfo = async (signClient: Client, session: SessionTypes.Struct) => {
  console.log("getInfo", signClient, session);
  console.log("getInfo - session.topic", session.topic);
  type getInfoType = {
    address: string;
    chainId: number;
    nodeUrl: string;
  };

  const result: getInfoType = await signClient.request({
    topic: session.topic,
    chainId: "zenon:1",
    request: {
      method: "znn_info",
      params: undefined,
    },
  });
  console.log("znn_info res", result);
  return result;
};

const signTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("signTransaction - params", params);
  console.log("signTransaction", signClient, session);
  const signature = await signClient.request({
    topic: session.topic,
    chainId: "zenon:1",
    request: {
      method: "znn_sign",
      params: JSON.stringify(params.accountBlock),
    },
  });
  console.log("znn_sign result", signature);

  return signature;
};

const sendTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("sendTransaction - params", params);
  console.log("sendTransaction", signClient, session);
  const result = await signClient.request({
    topic: session.topic,
    chainId: "zenon:1",
    request: {
      method: "znn_send",
      params: {
        fromAddress: params.fromAddress,
        accountBlock: params.accountBlock,
      },
    },
  });
  console.log("znn_send result", result);

  const accountBlock = Primitives.AccountBlockTemplate.fromJson(result || "{}");

  console.log("sendTransaction - accountBlock", accountBlock);
  return accountBlock;
};

const disconnectPairing = async (
  signClient: Client,
  pairing: PairingTypes.Struct,
  reasonMessage?: string,
  reasonData?: string
) => {
  try {
    console.log("Disconnecting, ", signClient, pairing);
    await signClient.disconnect({
      topic: pairing.topic,
      reason: {
        code: 1,
        message: reasonMessage || "Default Message",
        data: reasonData || "Default Data",
      },
    });
    console.log("localStorage", localStorage);
    return true;
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    toast(`Error: ${readableError}`, {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: "error",
      theme: "dark",
    });
  }
};

const disconnectSession = async (
  signClient: Client,
  session: SessionTypes.Struct,
  reasonMessage?: string,
  reasonData?: string
) => {
  try {
    console.log("Disconnecting, ", signClient, session);

    await signClient.session.delete(session.topic, {
      code: 1,
      message: reasonMessage || "Default Message",
      data: reasonData || "Default Data",
    });

    return true;
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    toast(`Error: ${readableError}`, {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: "error",
      theme: "dark",
    });
  }
};

const disconnectAllPairings = async (signClient: Client, reasonMessage?: string, reasonData?: string) => {
  console.log("Disconnecting all pairings, ", signClient, reasonMessage);
  try {
    return Promise.all(
      signClient.pairing.getAll().map(async (pairing) => {
        return await disconnectPairing(signClient, pairing, reasonMessage, reasonData);
      })
    );
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    toast(`Error: ${readableError}`, {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: "error",
      theme: "dark",
    });
  }
};

const disconnectAllSessions = async (signClient: Client, reasonMessage?: string, reasonData?: string) => {
  console.log("Disconnecting all sessions, ", signClient, reasonMessage);
  try {
    return Promise.all(
      signClient.session.getAll().map(async (session) => {
        return await disconnectSession(signClient, session, reasonMessage, reasonData);
      })
    );
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    toast(`Error: ${readableError}`, {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: "error",
      theme: "dark",
    });
  }
};

const registerEvents = (
  signClient: Client,
  onAddressChange: (newAddress: string) => unknown,
  onChainIdChange: (newChainId: string) => unknown,
  onNodeChange: (newChainId: string) => unknown
) => {
  // Subscribe to events

  // Available events
  // type Event = "session_proposal" | "session_update" | "session_extend" | "session_ping" | "session_delete" | "session_expire" | "session_request" | "session_request_sent" | "session_event" | "proposal_expire";

  // signClient.on("session_delete", (args) => {
  //   console.log(".on session_delete", args);
  // });

  // signClient.core.on("disconnect", (args: any) => {
  //   console.log(".on disconnect", args);
  // });

  // signClient.core.on("wc_pairingDelete", (args: any) => {
  //   console.log(".on wc_pairingDelete", args);
  // });

  // signClient.core.on("wc_sessionUpdate", (args: any) => {
  //   console.log(".on wc_sessionUpdate", args);
  // });

  // signClient.core.on("wc_sessionUpdate", (args: any) => {
  //   console.log(".on wc_sessionUpdate", args);
  // });

  // signClient.core.on("addressChange", (args: any) => {
  //   console.log(".on addressChange", args);
  // });

  // signClient.core.on("chainIdChange", (args: any) => {
  //   console.log(".on chainIdChange", args);
  // });

  // signClient.core.relayer.on("onRelayDisconnected", (args: any) => {
  //   console.log(".on onRelayDisconnected", args);
  // });

  // signClient.on("session_proposal", (args: any) => {
  //   console.log(".on session_proposal (should only be listened by the wallet)", args);
  // });

  // signClient.on("session_update", (args: any) => {
  //   console.log(".on session_update (should only be listened by the wallet)", args);
  // });

  // signClient.on("session_extend", (args: any) => {
  //   console.log(".on session_extend", args);
  // });

  // signClient.on("session_ping", (args: any) => {
  //   console.log(".on session_ping", args);
  // });

  // signClient.on("session_delete", (args: any) => {
  //   console.log(".on session_delete", args);
  // });

  // signClient.on("session_expire", (args: any) => {
  //   console.log(".on session_expire", args);
  // });

  // signClient.on("session_request", (args: any) => {
  //   console.log(".on session_request", args);
  // });

  // signClient.on("session_request_sent", (args: any) => {
  //   console.log(".on session_request_sent", args);
  // });

  signClient.on("session_event", (args: any) => {
    // This is where chainIdChange and addressChange happens
    console.log(".on session_event", args);

    switch (args?.params?.event?.name) {
      case "addressChange": {
        const newAddress = args?.params?.event?.data;
        console.log("addressChanged to", newAddress);
        onAddressChange(newAddress);
        break;
      }
      case "chainIdChange": {
        const newChainId = args?.params?.event?.data;
        console.log("chainIdChanged to", newChainId);
        onChainIdChange(newChainId);
        break;
      }
      case "nodeChange": {
        const newChainId = args?.params?.event?.data;
        console.log("nodeChanged to", newChainId);
        onNodeChange(newChainId);
        break;
      }

      default: {
        console.log("Unhandled event triggered", args?.params?.event?.name);
        break;
      }
    }
  });

  signClient.on("proposal_expire", (args: any) => {
    // TODO: Implement this
    console.log(".on proposal_expire", args);
  });
};

const walletConnectWrapper = {
  init,
  connect,
  getInfo,
  signTransaction,
  sendTransaction,
  disconnectAllPairings,
  disconnectAllSessions,
  disconnectPairing,
  disconnectSession,
  registerEvents,
};

export default walletConnectWrapper;
