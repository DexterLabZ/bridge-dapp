import Client from "@walletconnect/sign-client";
import { PairingTypes } from "@walletconnect/types";
import exportedConstants from "./constants";

export const allNamespaces = {
  zenon: {
    id: "syrius",
    // chains: [`zenon:${exportedConstants.defaultInternalChainId}`],
    // Syrius wallet only works on zenon:1
    chains: [`zenon:1`],
    methods: ["znn_sign", "znn_info", "znn_send"],
    events: ["chainIdChange", "addressChange"],
  },
  eip155: {
    methods: [
      "eth_accounts",
      "eth_sendTransaction",
      "eth_signTransaction",
      "eth_sign",
      "personal_sign",
      "eth_signTypedData",
      "eth_requestAccounts",
      "eth_chainId",
      "eth_getBalance",
      "eth_estimateGas",
    ],
    chains: [`eip155:${exportedConstants.defaultExternalChainId}`],
    events: ["chainChanged", "accountsChanged"],
  },
};
console.log("allNamespaces", allNamespaces);

declare type ArrayOneOrMore<T> = {
  0: T;
} & Array<T>;

export const individualChains = [exportedConstants.defaultExternalChainId] as ArrayOneOrMore<number>;

export const getRandomRpcProviderByChainId = (chainId: number) => {
  console.log("getRandomRpcProviderByChainId", chainId);
  const baseUrls = rpcProvidersByChainId?.[chainId]?.baseURLs;
  const randomBaseUrlIndex = Math.random() * (baseUrls?.length - 1);
  console.log("randomBaseUrlIndex", randomBaseUrlIndex);
  const randomBaseUrl = rpcProvidersByChainId?.[chainId]?.baseURLs[Math.round(randomBaseUrlIndex)];
  console.log("randomBaseUrl", randomBaseUrl);
  return randomBaseUrl;
};

export const rpcProvidersByChainId: Record<number, any> = {
  1: {
    name: "Ethereum Mainnet",
    // baseURLs: ["https://mainnet.infura.io/v3/5dc0df7abe4645dfb06a9a8c39ede422"],
    baseURLs: [
      "https://eth.llamarpc.com",
      "https://eth-mainnet.public.blastapi.io",
      "https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79",
      "https://nodes.mewapi.io/rpc/eth",
      "https://rpc.flashbots.net/",
    ],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  5: {
    name: "Ethereum Goerli",
    baseURLs: ["https://goerli.infura.io/v3/5dc0df7abe4645dfb06a9a8c39ede422"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  137: {
    name: "Polygon Mainnet",
    baseURLs: ["https://polygon-rpc.com"],
    token: {
      name: "Matic",
      symbol: "MATIC",
    },
  },
  280: {
    name: "zkSync Era Testnet",
    baseURLs: ["https://testnet.era.zksync.dev"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  324: {
    name: "zkSync Era",
    baseURLs: ["https://mainnet.era.zksync.io"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  80001: {
    name: "Polygon Mumbai",
    baseURLs: ["https://rpc-mumbai.maticvigil.com"],
    token: {
      name: "Matic",
      symbol: "MATIC",
    },
  },
  10: {
    name: "Optimism",
    baseURLs: ["https://mainnet.optimism.io"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  420: {
    name: "Optimism Goerli",
    baseURLs: ["https://goerli.optimism.io"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  42161: {
    name: "Arbitrum",
    baseURLs: ["https://arb1.arbitrum.io/rpc"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  421611: {
    name: "Arbitrum Rinkeby",
    baseURLs: ["https://rinkeby.arbitrum.io/rpc"],
    token: {
      name: "Ether",
      symbol: "ETH",
    },
  },
  100: {
    name: "xDAI",
    baseURLs: ["https://xdai-archive.blockscout.com"],
    token: {
      name: "xDAI",
      symbol: "xDAI",
    },
  },
  42220: {
    name: "Celo",
    baseURLs: ["https://forno.celo.org"],
    token: {
      name: "CELO",
      symbol: "CELO",
    },
  },
  44787: {
    name: "Celo",
    baseURLs: ["https://alfajores-forno.celo-testnet.org"],
    token: {
      name: "CELO",
      symbol: "CELO",
    },
  },
  11155111: {
    name: "Sepolia",
    // baseURLs: ["https://ethereum-sepolia.blockpi.network/v1/rpc/public"],
    baseURLs: ["https://ethereum-sepolia.publicnode.com"],
    token: {
      name: "ETH",
      symbol: "ETH",
    },
  },
};

export const defaultModalConfigCtrlState = {
  projectId: "",
  mobileWallets: undefined,
  desktopWallets: undefined,
  walletImages: undefined,
  chains: undefined,
  enableAuthMode: false,
  enableExplorer: true,
  explorerExcludedWalletIds: undefined,
  explorerRecommendedWalletIds: undefined,
  termsOfServiceUrl: undefined,
  privacyPolicyUrl: undefined,
};

export const deleteRecentWalletsFromLocalStorage = () => {
  localStorage.removeItem("WCM_RECENT_WALLET_DATA");
};

export const getCurrentNamespacePairings = (namespace: "zenon" | "eip155") => {
  const namespacesObj = JSON.parse(localStorage.getItem("walletConnectPairingsByNamespaces") || "{}");
  return namespacesObj?.[namespace] || [];
};

export const addToNamespacePairings = (namespace: "zenon" | "eip155", pairing: PairingTypes.Struct) => {
  const namespacesObj = JSON.parse(localStorage.getItem("walletConnectPairingsByNamespaces") || "{}");
  if (namespacesObj?.[namespace]?.length) {
    namespacesObj?.[namespace].push(pairing);
  } else {
    namespacesObj[namespace] = [pairing];
  }
  localStorage.setItem("walletConnectPairingsByNamespaces", JSON.stringify(namespacesObj));
};

export const isPairingFromCurrentNamespace = (pairing: PairingTypes.Struct, namespace: "zenon" | "eip155") => {
  return getCurrentNamespacePairings(namespace)?.find((p: any) => p.topic === pairing.topic);
};

export const getLatestActivePairingWithNoNamespaceAssigned = (signClient: Client) => {
  const allPairings = signClient.pairing.getAll();

  const relevantPairings = allPairings?.filter((p) => {
    if (!isPairingFromCurrentNamespace(p, "zenon") && !isPairingFromCurrentNamespace(p, "eip155")) {
      return true;
    } else return false;
  });
  console.log("relevantPairings", relevantPairings);
  return relevantPairings[0];
};

export const getLatestActivePairing = (signClient: Client, namespace?: "zenon" | "eip155") => {
  const allPairings = signClient.pairing.getAll();
  console.log("allPairings", allPairings);

  const activePairings = allPairings?.filter((p) => {
    if (namespace) {
      console.log(
        "isPairingFromCurrentNamespace(",
        p.topic,
        " ",
        namespace,
        " ",
        isPairingFromCurrentNamespace(p, namespace)
      );
      return p?.active === true && isPairingFromCurrentNamespace(p, namespace);
    } else {
      console.log("no namespace selected");
      return p?.active === true;
    }
  });
  console.log("activePairings", activePairings);

  const latestPairingIndex = activePairings.length - 1;
  const latestPairing = activePairings[latestPairingIndex];
  console.log("latestPairing", latestPairing);

  return latestPairing;
};

export const getLatestActiveSession = (signClient: Client, namespace?: "zenon" | "eip155") => {
  let namespaceFilter: any = {};
  if (namespace) {
    namespaceFilter[namespace] = allNamespaces[namespace];
  } else {
    namespaceFilter = allNamespaces;
  }

  console.log("requiredNamespaces", namespaceFilter);
  const filteredSessions = signClient.find({
    requiredNamespaces: namespaceFilter,
  });

  const activeSessions = filteredSessions?.filter((s) => s.expiry > Date.now() / 1000);
  console.log("activeSessions", activeSessions);

  const latestSessionIndex = activeSessions.length - 1;
  const latestSession = activeSessions[latestSessionIndex];
  console.log("latestSession", latestSession);

  return latestSession;
};
