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
import { ContractReceipt, ethers } from "ethers-ts";
import axios, { AxiosInstance } from "axios";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { EthereumRpcMap } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider";
import { SimpleToken } from "../../../models/SimpleToken";
import { TransactionReceiptResponse, anyProviderType, externalNetworkProviderTypes } from "./externalNetworkContext";
import exportedConstants from "../../../utils/constants";

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
  console.log("InitClient - wc ext");
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
  try {
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
  } catch (err) {
    //
    // Bug in the WalletConnect package
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/4257
    //
    console.error("Error initializing WalletConnectModal", err);
    throw new Error("Error initializing WalletConnectModal");
  }
};

const initProvider = async (externalNetworkChainId: number) => {
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
      await delay(3000);
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
        await delay(3000);

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

const getAccountsBalances = async (provider: ethers.providers.Web3Provider, _accounts: string[]) => {
  try {
    const arr = await Promise.all(
      _accounts.map(async (account) => {
        const [namespace, reference, address] = account.split(":");
        const chainId = `${namespace}:${reference}`;
        // const assets = await apiGetAccountBalance(address, chainId);
        // console.log("apiGetAccountBalanceRes", assets);

        const assets = await getBalance(provider, address, reference);
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

export const getBalance = async (
  provider: ethers.providers.JsonRpcProvider,
  account: string,
  tokenAddress?: string,
  tokenAbi?: string,
  isNativeCoin = false
): Promise<ethers.BigNumber> => {
  if (!isNativeCoin && tokenAddress && tokenAbi) {
    // Return the balance of the custom token
    const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    return await contract.balanceOf(account);
  } else {
    // Return the balance of the native token (ETH)
    return await provider.getBalance(account);
  }
};

const getConnectedAccounts = (session: SessionTypes.Struct): string[] => {
  const accounts = session?.namespaces?.eip155?.accounts;
  console.log("accounts", accounts);
  return accounts;
};

const getCurrentAccount = (session: SessionTypes.Struct): string => {
  return getConnectedAccounts(session)?.[0]?.split(":")?.[2];
};

const getConnectedChains = (session: SessionTypes.Struct): string[] => {
  const chains = session?.namespaces?.eip155?.chains || [];
  console.log("chains", chains);
  return chains;
};

const getCurrentChainId = (session: SessionTypes.Struct): number => {
  return Number(getConnectedChains(session)?.[0]?.split(":")?.[1] || "");
};

const signTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("signTransaction - params", params);
  console.log("signTransaction", signClient, session);
  const signature = await signClient.request({
    topic: session.topic,
    chainId: `eip155:${exportedConstants.defaultExternalChainId}`,
    request: {
      method: "eth_signTransaction",
      params: JSON.stringify(params.accountBlock),
    },
  });
  console.log("eth_signTransaction result", signature);

  return signature;
};

const estimateGas = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  signClient: Client,
  session: SessionTypes.Struct,
  pairing: PairingTypes.Struct,
  params: any[] = [],
  currentUserAddress: string,
  transactionValue: ethers.BigNumber = ethers.BigNumber.from("0"),
  transactionGasLimit: ethers.BigNumber = ethers.BigNumber.from("0")
) => {
  console.log("estimateGas()");
  const currentChainId = (await provider.getNetwork())?.chainId;
  const rpcMap = Object.entries(rpcProvidersByChainId).reduce((acc, [chainId, data]) => {
    acc[chainId.toString()] = getRandomRpcProviderByChainId(Number(chainId));
    return acc;
  }, {} as { [chainId: string]: string }) as EthereumRpcMap;

  console.log("rpcMap", rpcMap);
  console.log("individualChains", individualChains);

  const contract = new ethers.Contract(contractAddress, abi, provider);
  console.log("contract", contract);

  console.log("contractAddress", contractAddress);
  console.log("abi", abi);
  console.log("functionName - estimateGas.", functionName);
  console.log("params", params);

  const callData = contract.interface.encodeFunctionData(functionName, [...params]);
  console.log("callData", callData);
  console.log("ethers", ethers);
  console.log("transactionValue", transactionValue);

  type transactionParams = {
    from: string;
    to: string;
    data: string;
    value?: string;
    gasLimit?: string;
    gas?: string;
    nonce?: number;
  };
  const trParams: transactionParams = {
    from: currentUserAddress,
    to: contractAddress,
    data: callData,
  };

  if (!transactionValue.isZero()) {
    trParams.value = ethers.utils.hexStripZeros(ethers.utils.hexlify(transactionValue));
  } else {
    trParams.value = "0";
  }

  if (!transactionGasLimit.isZero()) {
    trParams.gas = ethers.utils.hexStripZeros(ethers.utils.hexlify(transactionGasLimit));
  }

  console.log("trParams", trParams);

  const req = {
    topic: session.topic,
    chainId: `eip155:${currentChainId}`,
    request: {
      method: "eth_estimateGas",
      params: [trParams],
    },
  };
  console.log("req", req);

  const rawResult: any = await signClient.request(req);
  console.log("rawResult", rawResult);

  const bnResult = ethers.BigNumber.from(rawResult);
  console.log("bnResult", bnResult);

  return bnResult;
};

const callContract = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  signClient: Client,
  session: SessionTypes.Struct,
  pairing: PairingTypes.Struct,
  params: any[] = [],
  currentUserAddress: string,
  transactionValue: ethers.BigNumber = ethers.BigNumber.from("0"),
  transactionGasLimit: ethers.BigNumber = ethers.BigNumber.from("0")
) => {
  console.log("callContract()");
  const currentChainId = (await provider.getNetwork())?.chainId;
  const contract = new ethers.Contract(contractAddress, abi, provider);
  console.log("contract", contract);

  console.log("contractAddress", contractAddress);
  console.log("abi", abi);
  console.log("functionName", functionName);
  console.log("params", params);

  const callData = contract.interface.encodeFunctionData(functionName, [...params]);
  console.log("callData", callData);
  console.log("ethers", ethers);
  console.log("transactionValue", transactionValue);

  type transactionParams = {
    from: string;
    to: string;
    data: string;
    value?: string;
    gasLimit?: string;
    gas?: string;
    nonce?: number;
  };
  const trParams: transactionParams = {
    from: currentUserAddress,
    to: contractAddress,
    data: callData,
  };

  if (!transactionValue.isZero()) {
    trParams.value = ethers.utils.hexStripZeros(ethers.utils.hexlify(transactionValue));
  } else {
    trParams.value = "0";
  }

  if (!transactionGasLimit.isZero()) {
    trParams.gas = transactionGasLimit.toString();
  }

  console.log("trParams", trParams);

  const req = {
    topic: session.topic,
    chainId: `eip155:${currentChainId}`,
    request: {
      method: "eth_sendTransaction",
      params: [trParams],
    },
  };
  console.log("req", req);

  const result: any = await signClient.request(req);
  console.log("result", result);

  const transactionConfirmationNeeded = 1;

  const receipt = await provider.waitForTransaction(result, transactionConfirmationNeeded);
  console.log("receipt", receipt);

  const response: TransactionReceiptResponse = {
    hash: receipt?.transactionHash,
    logIndex: receipt?.transactionIndex,
  };
  console.log("TransactionReceiptResponse", response);

  return response;
};

const sendTransaction = async (signClient: Client, session: SessionTypes.Struct, params: any) => {
  console.log("sendTransaction - params", params);
  console.log("sendTransaction", signClient, session);
  const result = await signClient.request({
    topic: session.topic,
    chainId: `eip155:${exportedConstants.defaultExternalChainId}`,
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

const requestNetworkSwitch = async (
  provider: any,
  newChainId: number,
  signClient: Client,
  session: SessionTypes.Struct
) => {
  console.log("requestNetworkSwitch()");
  const currentChainId = (await provider.getNetwork())?.chainId;

  const trParams = { chainId: ethers.utils.hexValue(newChainId) }; // chainId must be in hexadecimal numbers

  const req = {
    topic: session.topic,
    chainId: `eip155:${currentChainId}`,
    request: {
      method: "wallet_switchEthereumChain",
      params: [trParams],
    },
  };
  console.log("req", req);

  const rawResult: any = await signClient.request(req);
  console.log("rawResult", rawResult);

  return rawResult;
};

const disconnectPairing = async (
  signClient: Client,
  pairing: PairingTypes.Struct,
  reasonMessage?: string,
  reasonData?: string
) => {
  try {
    console.log("Disconnecting, ", signClient, pairing);
    await signClient.core.pairing.disconnect({ topic: pairing.topic });
    // await signClient.disconnect({
    //   topic: pairing.topic,
    //   reason: {
    //     code: 1,
    //     message: reasonMessage || "Default Message",
    //     data: reasonData || "Default Data",
    //   },
    // });
    console.log("localStorage", localStorage);
    return true;
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    // toast(`Error: ${readableError}`, {
    //   position: "bottom-center",
    //   autoClose: 5000,
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: false,
    //   draggable: true,
    //   type: "error",
    //   theme: "dark",
    // });
  }
};

const disconnectSession = async (
  signClient: Client,
  session: SessionTypes.Struct | { topic: string },
  reasonMessage?: string,
  reasonData?: string
) => {
  try {
    console.log("Disconnecting, ", signClient, session);

    await signClient.disconnect({
      topic: session.topic,
      reason: {
        code: 1,
        message: reasonMessage || "Default Message",
        data: reasonData || "Default Data",
      },
    });

    // await signClient.session.delete(session.topic, {
    //   code: 1,
    //   message: reasonMessage || "Default Message",
    //   data: reasonData || "Default Data",
    // });

    return true;
  } catch (err: any) {
    console.error(err);
    const readableError = err?.message || JSON.stringify(err);
    // toast(`Error: ${readableError}`, {
    //   position: "bottom-center",
    //   autoClose: 5000,
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: false,
    //   draggable: true,
    //   type: "error",
    //   theme: "dark",
    // });
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
    // toast(`Error: ${readableError}`, {
    //   position: "bottom-center",
    //   autoClose: 5000,
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: false,
    //   draggable: true,
    //   type: "error",
    //   theme: "dark",
    // });
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
    // toast(`Error: ${readableError}`, {
    //   position: "bottom-center",
    //   autoClose: 5000,
    //   hideProgressBar: false,
    //   closeOnClick: true,
    //   pauseOnHover: false,
    //   draggable: true,
    //   type: "error",
    //   theme: "dark",
    // });
  }
};

const registerEvents = (
  signClient: Client,
  provider: ethers.providers.JsonRpcProvider,
  onDisconnect: () => Promise<boolean>,
  onAddressChange: (
    newAddress: string,
    provider: ethers.providers.JsonRpcProvider,
    providerType: externalNetworkProviderTypes
  ) => unknown,
  onChainIdChange: (
    newChainId: string,
    provider: ethers.providers.JsonRpcProvider,
    providerType: externalNetworkProviderTypes
  ) => unknown,
  onAccountsChange: (
    newAccounts: string[],
    provider: ethers.providers.JsonRpcProvider,
    providerType: externalNetworkProviderTypes
  ) => unknown
) => {
  // Subscribe to events

  // Available events
  // type Event = "session_proposal" | "session_update" | "session_extend" | "session_ping" | "session_delete" | "session_expire" | "session_request" | "session_request_sent" | "session_event" | "proposal_expire";
  console.log("externalNetwork - registerEvents");

  signClient.core.on("disconnect", (args: any) => {
    console.log(".on external disconnect", args);
    // disconnectSession(signClient, { topic: args?.topic }, "Disconnected from the Wallet App");
    onDisconnect();
  });

  signClient.core.on("wc_pairingDelete", (args: any) => {
    console.log(".on external wc_pairingDelete", args);
  });

  signClient.core.on("wc_sessionUpdate", (args: any) => {
    console.log(".on external wc_sessionUpdate", args);
  });

  signClient.core.on("wc_sessionUpdate", (args: any) => {
    console.log(".on external wc_sessionUpdate", args);
  });

  signClient.core.on("addressChange", (args: any) => {
    console.log(".on external addressChange", args);
  });

  signClient.core.on("chainIdChange", (args: any) => {
    console.log(".on external chainIdChange", args);
  });

  signClient.core.relayer.on("onRelayDisconnected", (args: any) => {
    console.log(".on external onRelayDisconnected", args);
  });

  signClient.on("session_proposal", (args: any) => {
    console.log(".on external session_proposal (should only be listened by the wallet)", args);
  });

  signClient.on("session_update", (args: any) => {
    console.log(".on external session_update (should only be listened by the wallet)", args);
  });

  signClient.on("session_extend", (args: any) => {
    console.log(".on external session_extend", args);
  });

  signClient.on("session_ping", (args: any) => {
    console.log(".on external session_ping", args);
  });

  signClient.on("session_delete", (args: any) => {
    console.log(".on external session_delete", args);
    // disconnectSession(signClient, { topic: args?.topic }, "Disconnected from the Wallet App");
    onDisconnect();
  });

  signClient.on("session_expire", (args: any) => {
    console.log(".on external session_expire", args);
  });

  signClient.on("session_request", (args: any) => {
    console.log(".on external session_request", args);
  });

  signClient.on("session_request_sent", (args: any) => {
    console.log(".on external session_request_sent", args);
  });

  console.log("registeringEvents");
  signClient.on("session_event", (args: any) => {
    // This is where chainIdChange and addressChange happens
    console.log(".on external network session_event", args);
    console.log(".on session_event - provider", provider);

    const [networkId, chainId] = args?.params?.chainId?.split(":");
    console.log("[networkId, chainId]", [networkId, chainId]);

    // ToDo: do something about the hardcoded 'eip155' chainId'
    if (networkId === "eip155") {
      switch (args?.params?.event?.name) {
        case "accountsChanged": {
          const newAccounts = args?.params?.event?.data;
          console.log("addressChanged to", newAccounts);

          const newAddress = newAccounts[0].split(":")[2]?.toLowerCase();
          if (!newAddress?.length) {
            onDisconnect();
          } else {
            onAddressChange(newAddress, provider, externalNetworkProviderTypes.walletConnect);
          }

          const formattedChainId = newAccounts[0].split(":")[1];
          onChainIdChange(formattedChainId, provider, externalNetworkProviderTypes.walletConnect);
          if (!newAccounts?.length) {
            onDisconnect();
          } else {
            onAccountsChange(newAccounts, provider, externalNetworkProviderTypes.walletConnect);
          }
          break;
        }
        case "chainChanged": {
          const newAccounts = args?.params?.event?.data;
          console.log("chainIdChanged to", newAccounts);
          const newChainId = newAccounts[0].split(":")[1];

          onChainIdChange(newChainId, provider, externalNetworkProviderTypes.walletConnect);
          break;
        }

        default: {
          console.log("Unhandled event triggered", args?.params?.event?.name);
          break;
        }
      }
    }
  });

  signClient.on("session_event", (args: any) => {
    // Because of a weird walletConnect bug, we need to register this event twice
    // Otherwise, registering the internalNetwork session event won't work
    //
    // Might be because of the internal implementation of signClient.on()
    // and the way it registers multiple callbacks for the same event
    console.log(".on internal network session_event 2", args);
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
  getConnectedAccounts,
  getCurrentAccount,
  getCurrentChainId,
  getAccountsBalances,
  getBalance,
  signTransaction,
  estimateGas,
  callContract,
  sendTransaction,
  requestNetworkSwitch,
  disconnectAllPairings,
  disconnectAllSessions,
  disconnectPairing,
  disconnectSession,
  registerEvents,
};

export default externalNetworkWalletConnectWrapper;
