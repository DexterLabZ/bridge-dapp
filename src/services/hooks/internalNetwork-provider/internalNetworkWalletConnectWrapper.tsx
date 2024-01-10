import syriusLogo from "./../../../assets/logos/syrius-logo-padded.svg";
import Client, { SignClient } from "@walletconnect/sign-client";
import { WalletConnectModal, WalletConnectModalConfig } from "@walletconnect/modal";
import { SessionTypes, PairingTypes } from "@walletconnect/types";
import { Primitives } from "znn-ts-sdk";
import { toast } from "react-toastify";
import logoIcon from "./../../../assets/logos/zenon-big.png";
import { ConfigCtrl } from "@walletconnect/modal-core";
import { deleteRecentWalletsFromLocalStorage } from "../../../utils/utils";
import {
  addToNamespacePairings,
  allNamespaces,
  defaultModalConfigCtrlState,
  getLatestActivePairing,
  getLatestActivePairingWithNoNamespaceAssigned,
  getLatestActiveSession,
} from "../../../utils/wcUtils";
import constants from "../../../utils/constants";

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

const initClient = async () => {
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
const initModal = async () => {
  ConfigCtrl.state = { ...defaultModalConfigCtrlState };
  const wcConfig: WalletConnectModalConfig = {
    // ...ConfigCtrl.state,
    projectId: walletConnectProjectId,
    chains: ["zenon:1"],
    themeVariables: themeVariables,
    mobileWallets: [],
    desktopWallets: desktopWallets,
    walletImages: walletImages,
    explorerRecommendedWalletIds: [],
    explorerExcludedWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    ],
    enableExplorer: false,
    themeMode: "light",
  };

  ConfigCtrl.state = wcConfig;

  deleteRecentWalletsFromLocalStorage();
  const wcModal: WalletConnectModal = new WalletConnectModal(wcConfig);
  console.log("3. ConfigCtrl.state", { ...ConfigCtrl.state });
  ConfigCtrl.setConfig(wcConfig);
  await delay(1000);
  console.log("4. ConfigCtrl.state", { ...ConfigCtrl.state });

  return wcModal;
};

const connect = async (signClient: Client, onDismiss?: (reason: string) => unknown) => {
  console.log("Connecting wallet");
  const wcModal: WalletConnectModal = await initModal();

  wcModal.subscribeModal((state: any) => console.log("wcModal.subscribeModal", state));

  const latestPairing = getLatestActivePairing(signClient, "zenon");
  //
  // First step is to find out if we are already paired with a Wallet
  //
  if (latestPairing) {
    //
    // If we are paired we search for an available session.
    // Sessions can expire and we need to make sure they are still available
    //
    const latestSession = getLatestActiveSession(signClient, "zenon");
    if (latestSession) {
      //
      // If we are paired we search for an available session.
      //
      console.log("[CONNECTED] Found pairing and session. Already connected on ", latestPairing, latestSession);
      return { session: latestSession, pairing: latestPairing };
    } else {
      //
      //  Old Pairing, New Session
      //
      console.log("[CONNECTED] Creating new session on pairing", latestPairing);
      const retrievedSession = await signClient.connect({
        pairingTopic: latestPairing.topic,
        requiredNamespaces: { zenon: allNamespaces.zenon },
      });
      console.log("retrievedSession", retrievedSession);

      // We usually got some errors if not adding the delay. Sessions were not updated as soon as the await finished
      await delay(5000);
      const newSession = getLatestActiveSession(signClient, "zenon");
      console.log("[CONNECTED] New session", newSession);
      return { session: newSession, pairing: latestPairing };
    }
  } else {
    //
    // New Pairing, New Pairing
    //
    console.log("[CONNECTED] Creating new pairing and session");
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: { zenon: allNamespaces.zenon },
    });
    console.log("Generated uri", uri);
    if (uri) {
      try {
        await wcModal.openModal({
          requiredNamespaces: { zenon: allNamespaces.zenon },
          walletConnectChainIds: [],
          // optionalNamespaces: allNamespaces,
          uri: uri,
        });

        // await wcModal.openModal({standaloneChains: ["zenon:1"], uri: uri});
        wcModal.subscribeModal((state: any) => {
          if (state.open == false) {
            console.log("state", state);
            if (onDismiss) {
              onDismiss("User closed modal");
            }
          }
        });
        const session = await approval();
        console.log("[CONNECTED] Session", session);
        wcModal.closeModal();
        //
        // We usually got some errors if not adding the delay.
        // The new pairings was not in the list as soon as the await finished
        //
        await delay(5000);

        // Important !!!
        //
        // For now, we assume that the latest active pairing is from the current namespace
        // And that the user didn't trigger another pairing creation meanwhile.
        //
        // const newPairing = getLatestActivePairing(signClient);
        const newPairing = getLatestActivePairingWithNoNamespaceAssigned(signClient);

        // We save this latest pairing as being from this namespace and treat it as that
        //
        addToNamespacePairings("zenon", newPairing);

        console.log("[CONNECTED] newPairing", newPairing);
        return { session: session, pairing: newPairing };
      } catch (err) {
        console.error("Error approving", err);
        wcModal.closeModal();
        throw err;
      } finally {
        wcModal.closeModal();
      }
    } else {
      wcModal.closeModal();
      throw Error("Couldn't generate URI on new session or topic");
    }
  }
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
    // await signClient.core.pairing.disconnect({topic: pairing.topic});
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
    // ToDo: Implement this
    console.log(".on proposal_expire", args);
  });
};

const internalNetworkWalletConnectWrapper = {
  initClient,
  initModal,
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

export default internalNetworkWalletConnectWrapper;
