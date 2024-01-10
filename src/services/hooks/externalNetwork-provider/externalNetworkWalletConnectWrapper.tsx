import syriusLogo from "./../../../assets/logos/syrius-logo-padded.svg";
import Client, { SignClient } from "@walletconnect/sign-client";
import { WalletConnectModal, WalletConnectModalConfig } from "@walletconnect/modal";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { SessionTypes, PairingTypes, ProposalTypes } from "@walletconnect/types";
import { Primitives } from "znn-ts-sdk";
import { toast } from "react-toastify";
import logoIcon from "./../../../assets/logos/zenon-big.png";
import { deleteRecentWalletsFromLocalStorage, extractAddressesFromNamespacesAccounts } from "../../../utils/utils";
import { ConfigCtrl } from "@walletconnect/modal-core";
import {
  addToNamespacePairings,
  allNamespaces,
  defaultModalConfigCtrlState,
  getLatestActivePairing,
  getLatestActivePairingWithNoNamespaceAssigned,
  getLatestActiveSession,
  getRandomRpcProviderByChainId,
  individualChains,
  rpcProvidersByChainId,
} from "../../../utils/wcUtils";
import { ethers } from "ethers-ts";
import axios, { AxiosInstance } from "axios";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { EthereumRpcMap } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider";
import { SimpleToken } from "../../../models/SimpleToken";

const projectId = "6106aa8c2f308b338f31465bef999a1f";
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
    projectId: projectId,
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
    projectId: projectId,
    chains: allNamespaces.eip155.chains,
    themeVariables: themeVariables,
    // mobileWallets: [],
    // mobileWallets: mobileWallets,
    desktopWallets: [],
    // desktopWallets: desktopWallets,
    // walletImages: walletImages,
    // explorerRecommendedWalletIds: "NONE",
    explorerRecommendedWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
      "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    ],
    explorerExcludedWalletIds: [],
    enableExplorer: true,
    themeMode: "light",
  };

  ConfigCtrl.state = wcConfig;

  deleteRecentWalletsFromLocalStorage();
  const wcModal: WalletConnectModal = new WalletConnectModal(wcConfig);
  // ConfigCtrl.setConfig(wcConfig);
  await delay(1000);

  return wcModal;
};

const initProvider = async (externalNetworkChainId: any) => {
  //
  // Using JsonRpcProvider
  //
  const RPC_URL = getRandomRpcProviderByChainId(externalNetworkChainId);
  console.log("RPC_URL", RPC_URL);
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  return provider;
};
const connect = async (signClient: Client, onDismiss?: (reason: string) => unknown) => {
  console.log("Connecting wallet");

  const wcModal: WalletConnectModal = await initModal();

  wcModal.subscribeModal((state: any) => console.log("wcModal.subscribeModal", state));

  // openInNewTab("syrius://");

  // wcModal.connect("desktop", {link: "syrius://abc"}).then((provider: any) => {
  //   console.log("provider", provider);
  //   // Do something with the provider, such as initializing a web3 instance
  // });

  const latestPairing = getLatestActivePairing(signClient, "eip155");
  //
  // First step is to find out if we are already paired with a Wallet
  //
  if (latestPairing) {
    //
    // If we are paired we search for an available session.
    // Sessions can expire and we need to make sure they are still available
    //
    const latestSession = getLatestActiveSession(signClient, "eip155");
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
      // openInNewTab("syrius://");

      const retrievedSession = await signClient.connect({
        pairingTopic: latestPairing.topic,
        requiredNamespaces: { eip155: allNamespaces.eip155 },
      });

      console.log("retrievedSession", retrievedSession);
      // const ethProvider = new ethers.providers.Web3Provider(modalProvider);

      // We usually got some errors if not adding the delay. Sessions were not updated as soon as the await finished
      await delay(5000);
      const newSession = getLatestActiveSession(signClient, "eip155");
      console.log("[CONNECTED] New session", newSession);
      return { session: newSession, pairing: latestPairing };
    }
  } else {
    //
    // New Pairing, New Pairing
    //
    console.log("[CONNECTED] Creating new pairing and session");
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: { eip155: allNamespaces.eip155 },
    });
    console.log("Generated uri", uri);
    if (uri) {
      try {
        // await wcModal.openModal({uri});
        // await wcModal.openModal({chains: ["eip155:11155111"], uri: uri});
        await wcModal.openModal({
          requiredNamespaces: { eip155: allNamespaces.eip155 },
          walletConnectChainIds: [1],
          // optionalNamespaces: allNamespaces,
          uri: uri,
        });

        wcModal.subscribeModal((state: any) => {
          if (state.open == false) {
            console.log("state", state);
            if (onDismiss) {
              onDismiss("User closed modal");
            }
          }
        });
        // openInNewTab("syrius://" + uri);
        //
        // await approval() opens the confirmation dialog on the SyriusWallet desktop app
        //
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

        const newPairing = getLatestActivePairingWithNoNamespaceAssigned(signClient);
        // const newPairing = getLatestActivePairing(signClient, "eip155");
        // We save this latest pairing as being from this namespace and treat it as that
        //
        addToNamespacePairings("eip155", newPairing);

        console.log("[CONNECTED] newPairing", newPairing);
        return { session: session, pairing: newPairing };
      } catch (err) {
        console.error("Error approving", err);
        wcModal.closeModal();
        throw err;
      } finally {
        wcModal.closeModal();
        // ConfigCtrl.setConfig(defaultModalConfigCtrl);
      }
    } else {
      wcModal.closeModal();
      throw Error("Couldn't generate URI on new session or topic");
    }
  }
};

const getAccountBalances = async (_accounts: string[]) => {
  try {
    const arr = await Promise.all(
      _accounts.map(async (account) => {
        const [namespace, reference, address] = account.split(":");
        const chainId = `${namespace}:${reference}`;
        // const assets = await apiGetAccountBalance(address, chainId);
        // console.log("apiGetAccountBalanceRes", assets);

        const assets = await getAccountBalance(address, chainId);
        console.log("assets", assets);

        return { account, assets: [assets] };
      })
    );

    const balances: any = {};
    arr.forEach(({ account, assets }) => {
      balances[account] = assets;
    });
    return balances;
  } catch (e) {
    console.error(e);
  }
};

export interface AssetData {
  symbol: string;
  name: string;
  contractAddress?: string;
  balance?: string;
}

export async function apiGetAccountBalance(address: string, chainId: string): Promise<AssetData> {
  const [namespace, networkId] = chainId.split(":");
  const RPC_URL = getRandomRpcProviderByChainId(Number(networkId));

  console.log("[namespace, networkId]", [namespace, networkId]);
  const api: AxiosInstance = axios.create({
    baseURL: RPC_URL,
    timeout: 10000, // 10 secs
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (namespace !== "eip155") {
    return { balance: "", symbol: "", name: "" };
  }

  const token = rpcProvidersByChainId[Number(networkId)].token;
  if (!RPC_URL) {
    return { balance: "", symbol: "", name: "" };
  }
  const response = await api.post(RPC_URL, {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [address, "latest"],
    id: 1,
  });
  const { result } = response.data;
  const balance = parseInt(result, 16).toString();
  return { balance, ...token };
}

export async function getAccountBalance(
  holderAddress: string,
  chainId: string
  // token: SimpleToken,
  // tokenAbi: string
): Promise<AssetData> {
  const [namespace, networkId] = chainId.split(":");
  console.log("[namespace, networkId]", [namespace, networkId]);

  const RPC_URL = getRandomRpcProviderByChainId(Number(networkId));
  console.log("RPC_URL", RPC_URL);

  const rpcProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
  console.log("rpcProvider", rpcProvider);

  // const contract = new ethers.Contract(token.address, tokenAbi, rpcProvider);
  // console.log("contract", contract);

  // const rawWznnBalance = await contract.balanceOf(holderAddress);
  // tokenBalance = ethers.utils.formatUnits(rawWznnBalance, token.decimals);

  const token = rpcProvidersByChainId[Number(networkId)].token;
  if (!RPC_URL) {
    return { balance: "", symbol: "", name: "" };
  }

  const res = await rpcProvider.getBalance(holderAddress);
  const balance = ethers.utils.formatUnits(res, token.decimals);

  // const api: AxiosInstance = axios.create({
  //   baseURL: RPC_URL,
  //   timeout: 10000, // 10 secs
  //   headers: {
  //     Accept: "application/json",
  //     "Content-Type": "application/json",
  //   },
  // });

  if (namespace !== "eip155") {
    return { balance: "", symbol: "", name: "" };
  }
  // const response = await api.post(RPC_URL, {
  //   jsonrpc: "2.0",
  //   method: "eth_getBalance",
  //   params: [holderAddress, "latest"],
  //   id: 1,
  // });
  // const { result } = response.data;
  // const balance = parseInt(result, 16).toString();
  return { balance, ...token };
}

const getInfo = async (signClient: Client, session: SessionTypes.Struct) => {
  console.log("getInfo - session.topic", session.topic);

  const accounts = session.namespaces.eip155.accounts;
  console.log("getInfo - accounts", accounts);
  const addresses = extractAddressesFromNamespacesAccounts(accounts);
  console.log("eth_requestAccounts addresses", addresses);
  const balances = await getAccountBalances(accounts);

  // const testAddress = accounts[0];
  // const req = {
  //   topic: session.topic,
  //   chainId: "eip155:11155111",
  //   request: {
  //     method: "eth_getBalance",
  //     params: [testAddress, "latest"],
  //   },
  // };
  // console.log("eth_getBalance req", req);

  // const result = await signClient.request(req);
  // console.log("eth_getBalance result", result);

  console.log("eth_requestAccounts balances", balances);

  // ToDo: RETURN ChainId Here and then pass it everywhere
  return balances;
};

const signTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("signTransaction - params", params);
  console.log("signTransaction", signClient, session);
  const signature = await signClient.request({
    topic: session.topic,
    chainId: "eip155:11155111",
    request: {
      method: "eth_signTransaction",
      params: JSON.stringify(params.accountBlock),
    },
  });
  console.log("eth_signTransaction result", signature);

  return signature;
};

const callContract = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  signClient: Client,
  session: SessionTypes.Struct,
  pairing: PairingTypes.Struct,
  params: any[] = []
) => {
  console.log("callContract()");
  // console.log("contractAddress", contractAddress);
  // console.log("functionName", functionName);
  // console.log("provider", provider);
  // console.log("params", params);
  // console.log("abi", abi);

  //
  // Version 1
  // Using JSON RPC Provider
  //
  // const contract = new ethers.Contract(contractAddress, abi, provider);

  // const signer = new ethers.providers.Web3Provider(provider).getSigner();
  // const signedContract = contract.connect(signer);
  // console.log("contract", contract);
  // console.log("signedContract", signedContract);

  // let res;
  // if (params?.length) {
  //   res = await signedContract[functionName](...params);
  // } else {
  //   res = await signedContract[functionName]();
  // }
  // // const res = await signedContract[functionName](...params);
  // console.log("callContract res", res);
  // return res;

  //
  // Version 2
  // Using WalletConnect's Ethereum Provider method
  //
  const rpcMap = Object.entries(rpcProvidersByChainId).reduce((acc, [chainId, data]) => {
    acc[chainId.toString()] = getRandomRpcProviderByChainId(Number(chainId));
    return acc;
  }, {} as { [chainId: string]: string }) as EthereumRpcMap;

  console.log("rpcMap", rpcMap);
  console.log("individualChains", individualChains);

  const _provider = await EthereumProvider.init({
    // rpcMap?: EthereumRpcMap;
    // metadata?: Metadata;
    // qrModalOptions?: QrModalOptions;

    projectId: projectId, // REQUIRED your projectId
    chains: [11155111], // REQUIRED chain ids
    optionalChains: undefined, // OPTIONAL chains
    showQrModal: true, // REQUIRED set to "true" to use @walletconnect/modal
    methods: allNamespaces.eip155.methods, // REQUIRED ethereum methods
    optionalMethods: undefined, // OPTIONAL ethereum methods
    events: allNamespaces.eip155.events, // REQUIRED ethereum events
    optionalEvents: undefined, // OPTIONAL ethereum events
    rpcMap: rpcMap,
    // metadata, // OPTIONAL metadata of your app
    // qrModalOptions: wcConfig,
  });

  console.log("ethereumProvider", _provider);

  //
  // These events are for logging and testing purposes only
  //
  _provider.on("display_uri", (uri: string) => {
    // Handle the display of the QR code URI
    console.log("On display url: ", uri);
  });
  _provider.on("chainChanged", (chainId: string) => {
    // Handle chain change
  });
  _provider.on("accountsChanged", (accounts: string[]) => {
    // Handle accounts change
  });
  //
  // End events
  //

  //
  // Version 2 with connect
  //
  // const connected = _provider.connect();
  // const connected = await _provider.connect({
  //   chains: [11155111], // OPTIONAL chain ids
  //   rpcMap: rpcMap, // OPTIONAL rpc urls
  //   pairingTopic: pairing.topic, // OPTIONAL pairing topic
  // });
  // console.log("connected", connected);

  //
  // Version 2 with enable
  //
  const enabled = await _provider.enable();
  console.log("enabled", enabled);

  // const eth_requestAccounts = await _provider.request({method: "eth_requestAccounts"});
  // console.log("eth_requestAccounts", eth_requestAccounts);

  // const req = {
  //   method: functionName,
  //   params: params,
  // };
  // console.log("req", req);

  // const result = await _provider.request(req);
  // console.log("result", result);

  // const req2 = {
  //   method: "eth_call",
  //   params: params,
  // };
  // console.log("req2", req2);

  // const result2 = await _provider.request(req2);
  // console.log("result2", result2);
  // return result2;

  // const req3 = {
  //   method: "eth_call",
  //   params: params,
  // };

  // const result3 = await _provider.signer.request(req3, "11155111");
  // console.log("result3", result3);

  //
  // Version 3
  // Using sign client
  //

  // const req = {
  //   topic: session.topic,
  //   chainId: "eip155:11155111",
  //   request: {
  //     method: functionName,
  //     params: params,
  //   },
  // };
  // console.log("req", req);

  // const result: any = await signClient.request(req);
  // console.log("result", result);
  // return result;

  //
  // Version 4
  //

  const RPC_URL = getRandomRpcProviderByChainId(_provider.chainId);
  console.log("RPC_URL", RPC_URL);

  const rpcProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
  console.log("rpcProvider", rpcProvider);

  const contract = new ethers.Contract(contractAddress, abi, rpcProvider);
  console.log("contract", contract);

  console.log("contractAddress", contractAddress);
  console.log("abi", abi);
  console.log("functionName", functionName);
  console.log("params", params);

  // const encodeParams = [params[0], params[1].toString()];

  const callData = contract.interface.encodeFunctionData(functionName, [...params]);
  console.log("callData", callData);

  const transactionValue = 0;

  const trParams = {
    from: _provider?.accounts?.[0],
    to: contractAddress,
    data: callData,
    // data: "0x",
    // value: params[1].toHexString(),
    value: transactionValue,
  };
  console.log("trParams", trParams);

  // const req4 = {
  //   method: "eth_sendTransaction",
  //   params: [trParams],
  // };
  // console.log("req4", req4);

  // const result4 = await _provider.request(req4);
  // console.log("result4", result4);
  // return result4;

  //
  // Version 5
  // Using sign client with different params
  //

  const req = {
    topic: session.topic,
    chainId: "eip155:11155111",
    request: {
      method: "eth_sendTransaction",
      params: [trParams],
    },
  };
  console.log("req", req);

  const result: any = await signClient.request(req);
  console.log("result", result);

  const receipt = await rpcProvider.waitForTransaction(result, 2);
  console.log("receipt", receipt);

  return result;
};

const sendTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("sendTransaction - params", params);
  console.log("sendTransaction", signClient, session);
  const result = await signClient.request({
    topic: session.topic,
    chainId: "eip155:11155111",
    request: {
      method: "eth_sendTransaction",
      params: {
        ...params.transaction,
        // from: params.fromAddress,
      },
    },
  });
  console.log("eth_sendTransaction result", result);

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
  onChainIdChange: (newChainId: string) => unknown
) => {
  // Subscribe to events

  // Available events
  // type Event = "session_proposal" | "session_update" | "session_extend" | "session_ping" | "session_delete" | "session_expire" | "session_request" | "session_request_sent" | "session_event" | "proposal_expire";

  signClient.core.on("disconnect", (args: any) => {
    console.log(".on disconnect", args);
  });

  signClient.core.on("wc_pairingDelete", (args: any) => {
    console.log(".on wc_pairingDelete", args);
  });

  signClient.core.on("wc_sessionUpdate", (args: any) => {
    console.log(".on wc_sessionUpdate", args);
  });

  signClient.core.on("wc_sessionUpdate", (args: any) => {
    console.log(".on wc_sessionUpdate", args);
  });

  signClient.core.on("addressChange", (args: any) => {
    console.log(".on addressChange", args);
  });

  signClient.core.on("chainIdChange", (args: any) => {
    console.log(".on chainIdChange", args);
  });

  signClient.core.relayer.on("onRelayDisconnected", (args: any) => {
    console.log(".on onRelayDisconnected", args);
  });

  signClient.on("session_proposal", (args: any) => {
    console.log(".on session_proposal (should only be listened by the wallet)", args);
  });

  signClient.on("session_update", (args: any) => {
    console.log(".on session_update (should only be listened by the wallet)", args);
  });

  signClient.on("session_extend", (args: any) => {
    console.log(".on session_extend", args);
  });

  signClient.on("session_ping", (args: any) => {
    console.log(".on session_ping", args);
  });

  signClient.on("session_delete", (args: any) => {
    console.log(".on session_delete", args);
  });

  signClient.on("session_expire", (args: any) => {
    console.log(".on session_expire", args);
  });

  signClient.on("session_request", (args: any) => {
    console.log(".on session_request", args);
  });

  signClient.on("session_request_sent", (args: any) => {
    console.log(".on session_request_sent", args);
  });

  console.log("registeringEvents");
  signClient.on("session_event", (args: any) => {
    // This is where chainIdChange and addressChange happens
    console.log(".on session_event", args);

    switch (args?.params?.event?.name) {
      case "accountsChanged": {
        const newAddress = args?.params?.event?.data;
        // console.log("addressChanged to", newAddress);
        onAddressChange(newAddress);
        break;
      }
      case "chainChanged": {
        const newChainId = args?.params?.event?.data;
        // console.log("chainIdChanged to", newChainId);
        onChainIdChange(newChainId);
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

const externalNetworkWalletConnectWrapper = {
  initClient,
  initModal,
  initProvider,
  connect,
  getInfo,
  signTransaction,
  callContract,
  sendTransaction,
  disconnectAllPairings,
  disconnectAllSessions,
  disconnectPairing,
  disconnectSession,
  registerEvents,
};

export default externalNetworkWalletConnectWrapper;
