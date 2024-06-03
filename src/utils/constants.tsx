import { abiContract, abiEmbedded, abiToken, alternativeWznnAbi, pairAbi, routerAbi, wznnAbi } from "./abi";

const constants = {
  //
  // PROD ENV CONSTANTS
  //
  officialSyriusExtensionUrl: "https://github.com/DexterLabZ/syrius-extension/releases/tag/v0.1.9",
  officialSyriusWalletUrl: "https://github.com/zenon-network/syrius/releases/latest",
  officialMetamaskExtensionUrl: "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
  officialBridgeCommunityUrl: "https://bridge.mainnet.zenon.community",
  isMainNet: true,
  isDevNet: false,
  isTestNet: false,
  isSupernovaTestNet: false,
  isSupernovaMainNet: false,
  supernovaChainId: parseInt(process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_MAINNET_CHAIN_ID || "0"),
  feeDenominator: 10000,

  maxLogIndex: 4000000000,

  // This is just a fallback default value
  wrapRedeemDelayInSeconds: 120,
  // This is just a fallback default value
  estimatedMomentumTimeInSeconds: 10,

  externalNetworkExplorerURLbyChainId: {
    "1": "https://etherscan.io/tx/",
    "5": "https://goerli.etherscan.io/tx/",
    "97": "https://testnet.bscscan.com/tx/",
    "31337": "https://goerli.etherscan.io/tx/",
    "11155111": "https://sepolia.etherscan.io/tx/",
  },

  internalNetworkExplorerURLbyChainId: {
    "1": "https://zenonhub.io/explorer/transaction/",
    "3": "https://explorer.zenon.network/transaction/",
  },

  defaultInternalChainId: 1,
  defaultExternalChainId: 1,

  defaultNodeToConnect: "wss://syrius-mainnet.zenon.community",
  uniswapPoolLink: "https://v2.info.uniswap.org/pair/0xdac866A3796F85Cb84A914d98fAeC052E3b5596D",

  buyZnnLandingPageURL:
    "https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xb2e96a63479c2edd2fd62b382c89d5ca79f572d3",

  // Update the default addresses of those tokens if the addresses ever change
  bscWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address: "",
  },
  ethWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address: "0xb2e96a63479C2Edd2FD62b382c89D5CA79f572d3",
  },
  xZnnTokenInfo: {
    isNativeCoin: true,
    symbol: "XZNN",
    name: "xZenon",
    decimals: 18,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_MAINNET_ETH_XZNN_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
  },
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "0x96546afe4a21515a3a30cd3fd64a70eb478dc174",
  },

  // Internal default tokens
  znnTokenInfo: {
    symbol: "ZNN",
    decimals: 8,
    address: "zts1znnxxxxxxxxxxxxx9z4ulx",
  },
  qsrTokenInfo: {
    symbol: "QSR",
    decimals: 8,
    address: "zts1qsrxxxxxxxxxxxxxmrhjll",
  },
  znnEthLpTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: "zts17d6yr02kh0r9qr566p7tg6",
  },
  qsrEthLpTokenInfo: {
    symbol: "QSRETHLP",
    decimals: 18,
    address: "zts1akfzw3s3h6ytwm07x9mldh",
  },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "ETH",
      chainId: 1,
      // contractAddress is also known as bridgeAddress
      contractAddress: "0xa98706106f7710d743186031be2245f33acea106",
    },
  },

  // Liquidity pairs
  defaultLiquidityPairsDetails: {
    ETH: {
      wethTokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      // LP Token address is the same as pair address
      lpTokenAddress: "0xdac866A3796F85Cb84A914d98fAeC052E3b5596D",
      pairAddress: "0xdac866A3796F85Cb84A914d98fAeC052E3b5596D",
      // Uniswap v2 Router
      routerContract: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    },
  },

  internalAvailableNetworks: null,
  externalAvailableNetworks: null,
  internalAvailableTokens: null,
  externalAvailableTokens: null,
  tokenPairs: null,

  liquidityExternalNetworks: null,
  liquidityInternalNetworks: null,
  liquidityExternalTokens: null,
  liquidityInternalTokens: null,
  liquidityTokenPairs: null,

  routerAbi: routerAbi,

  pairAbi: pairAbi,

  wznnAbi: wznnAbi,

  alternativeWznnAbi: alternativeWznnAbi,
  abiToken: abiToken,
  abiContract: abiContract,
  abiEmbedded: abiEmbedded,

  stakingDurations: [
    {
      label: "1 Month",
      months: 1,
      value: 2592000,
      multiplierValue: 1,
      multiplierLabel: "1x",
    },
    {
      label: "2 Months",
      months: 2,
      value: 5184000,
      multiplierValue: 2,
      multiplierLabel: "2x",
    },
    {
      label: "3 Months",
      months: 3,
      value: 7776000,
      multiplierValue: 3,
      multiplierLabel: "3x",
    },
    {
      label: "4 Months",
      months: 4,
      value: 10368000,
      multiplierValue: 4,
      multiplierLabel: "4x",
    },
    {
      label: "5 Months",
      months: 5,
      value: 12960000,
      multiplierValue: 5,
      multiplierLabel: "5x",
    },
    {
      label: "6 Months",
      months: 6,
      value: 15552000,
      multiplierValue: 6,
      multiplierLabel: "6x",
    },
    {
      label: "7 Months",
      months: 7,
      value: 18144000,
      multiplierValue: 7,
      multiplierLabel: "7x",
    },
    {
      label: "8 Months",
      months: 8,
      value: 20736000,
      multiplierValue: 8,
      multiplierLabel: "8x",
    },
    {
      label: "9 Months",
      months: 9,
      value: 23328000,
      multiplierValue: 9,
      multiplierLabel: "9x",
    },
    {
      label: "10 Months",
      months: 10,
      value: 25920000,
      multiplierValue: 10,
      multiplierLabel: "10x",
    },
    {
      label: "11 Months",
      months: 11,
      value: 28512000,
      multiplierValue: 11,
      multiplierLabel: "11x",
    },
    {
      label: "12 Months",
      months: 12,
      value: 31104000,
      multiplierValue: 12,
      multiplierLabel: "12x",
    },
  ],

  GTM_ID: "",
  /**
   * * @mehowbrainz twitter developer account
   */
  TWITTER_EVENT: {
    PIXEL_ID: "",
    EVENT_ID: "",
  },
};

//
// TEST ENV CONSTANTS
//
const testConstants = {
  ...constants,
  isMainNet: false,
  isDevNet: false,
  isTestNet: true,
  isSupernovaTestNet: false,
  isSupernovaMainNet: false,

  supernovaChainId: parseInt(process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_CHAIN_ID || "0"),
  defaultInternalChainId: 3,
  defaultExternalChainId: 11155111,

  defaultNodeToConnect: "wss://syrius-testnet.zenon.community",
  officialBridgeCommunityUrl: "https://bridge.testnet.zenon.community",

  bscWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address: "",
  },
  ethWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_ETH_WZNN_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_ETH_WQSR_ADDRESS || "0x0000000000000000000000000000000000000000",
  },

  // Internal tokens
  znnEthLpTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_ZNN_ETH_LP_ADDRESS || "zts000000000000000000000000",
  },
  qsrEthLpTokenInfo: {
    symbol: "QSRETHLP",
    decimals: 18,
    address: process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_QSR_ETH_LP_ADDRESS || "zts000000000000000000000000",
  },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "TEST-ETH",
      chainId: 11155111,
      // contractAddress is also known as bridgeAddress
      contractAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_LIQUIDITY_EXTERNAL_NETWORK_ETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    },
  },

  // Liquidity pairs
  defaultLiquidityPairsDetails: {
    ETH: {
      wethTokenAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_LIQUIDITY_DEFAULT_PAIRS_WETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      // Lp Token address is the same as pair address
      lpTokenAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_LIQUIDITY_DEFAULT_PAIRS_LP_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      pairAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_LIQUIDITY_DEFAULT_PAIRS_PAIR_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      // Router
      routerContract:
        process.env.REACT_APP_PUBLIC_CONSTANTS_TEST_LIQUIDITY_DEFAULT_PAIRS_ROUTER_CONTRACT_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    },
  },

  stakingDurations: [
    {
      label: "30 Seconds",
      months: 1,
      value: 30,
      multiplierValue: 1.1,
      multiplierLabel: "1.1x",
    },
    {
      label: "1 Minute",
      months: 1,
      value: 60,
      multiplierValue: 1.1,
      multiplierLabel: "1.1x",
    },
    {
      label: "2 Minutes",
      months: 2,
      value: 120,
      multiplierValue: 1.2,
      multiplierLabel: "1.2x",
    },
    {
      label: "3 Minutes",
      months: 3,
      value: 180,
      multiplierValue: 1.3,
      multiplierLabel: "1.3x",
    },
    {
      label: "4 Minutes",
      months: 4,
      value: 240,
      multiplierValue: 1.4,
      multiplierLabel: "1.4x",
    },
    {
      label: "5 Minutes",
      months: 5,
      value: 300,
      multiplierValue: 1.5,
      multiplierLabel: "1.5x",
    },
    {
      label: "6 Minutes",
      months: 6,
      value: 360,
      multiplierValue: 1.6,
      multiplierLabel: "1.6x",
    },
  ],
  GTM_ID: "GTM-XXXXXX",
  TWITTER_EVENT: {
    PIXEL_ID: "xxxxx",
    EVENT_ID: "xx-xxxxx-xxxxxx",
  },
};

//
// DEV ENV CONSTANTS
//
const developmentConstants = {
  ...constants,
  isMainNet: false,
  isDevNet: true,
  isTestNet: false,
  isSupernovaTestNet: false,
  isSupernovaMainNet: false,

  supernovaChainId: parseInt(process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_DEVNET_CHAIN_ID || "0"),
  defaultInternalChainId: 3,
  defaultExternalChainId: 11155111,

  defaultNodeToConnect: "wss://syrius-testnet.zenon.community",
  officialBridgeCommunityUrl: "https://bridge.testnet.zenon.community",

  bscWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address: "",
  },
  ethWznnTokenInfo: {
    symbol: "wZNN",
    decimals: 8,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_ETH_WZNN_ADDRESS || "0x0000000000000000000000000000000000000000",
  },
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_ETH_WQSR_ADDRESS || "0x0000000000000000000000000000000000000000",
  },

  // Internal tokens
  znnEthLpTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_ZNN_ETH_LP_ADDRESS || "zts000000000000000000000000",
  },
  qsrEthLpTokenInfo: {
    symbol: "QSRETHLP",
    decimals: 18,
    address: process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_QSR_ETH_LP_ADDRESS || "zts000000000000000000000000",
  },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "DEV-ETH",
      chainId: 11155111,
      // contractAddress is also known as bridgeAddress
      contractAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_LIQUIDITY_EXTERNAL_NETWORK_ETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    },
  },

  // Liquidity pairs
  defaultLiquidityPairsDetails: {
    ETH: {
      wethTokenAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_LIQUIDITY_DEFAULT_PAIRS_WETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      // Lp Token address is the same as pair address
      lpTokenAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_LIQUIDITY_DEFAULT_PAIRS_LP_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      pairAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_LIQUIDITY_DEFAULT_PAIRS_PAIR_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      // Router
      routerContract:
        process.env.REACT_APP_PUBLIC_CONSTANTS_DEV_LIQUIDITY_DEFAULT_PAIRS_ROUTER_CONTRACT_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    },
  },

  stakingDurations: [
    {
      label: "30 Seconds",
      months: 1,
      value: 30,
      multiplierValue: 1.1,
      multiplierLabel: "1.1x",
    },
    {
      label: "1 Minute",
      months: 1,
      value: 60,
      multiplierValue: 1.1,
      multiplierLabel: "1.1x",
    },
    {
      label: "2 Minute",
      months: 2,
      value: 120,
      multiplierValue: 1.2,
      multiplierLabel: "1.2x",
    },
    {
      label: "3 Minute",
      months: 3,
      value: 180,
      multiplierValue: 1.3,
      multiplierLabel: "1.3x",
    },
    {
      label: "4 Minute",
      months: 4,
      value: 240,
      multiplierValue: 1.4,
      multiplierLabel: "1.4x",
    },
    {
      label: "5 Minute",
      months: 5,
      value: 300,
      multiplierValue: 1.5,
      multiplierLabel: "1.5x",
    },
    {
      label: "6 Minute",
      months: 6,
      value: 360,
      multiplierValue: 1.6,
      multiplierLabel: "1.6x",
    },
  ],
  GTM_ID: "GTM-XXXXXX",
  TWITTER_EVENT: {
    PIXEL_ID: "xxxxx",
    EVENT_ID: "xx-xxxxx-xxxxxx",
  },
};

//
// ExtensionChain TEST-NET ENV CONSTANTS
//
const supernovaTestNetConstants = {
  ...constants,
  isMainNet: false,
  isDevNet: false,
  isTestNet: false,

  isSupernovaTestNet: true,
  isSupernovaMainNet: false,
  //
  // This flag tells if it's supernova network, regardless if it's devnet, testnet, mainnet
  // It's here so we only have to make one verification in the rest of the app
  //
  isSupernovaNetwork: true,

  supernovaChainId: parseInt(process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_CHAIN_ID || "0"),
  defaultInternalChainId: 3,
  defaultExternalChainId: parseInt(process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_CHAIN_ID || "0"),

  defaultNodeToConnect: "http://167.235.233.238:8545",
  officialBridgeCommunityUrl: "https://bridge.supernova.zenon.community",

  xZnnTokenInfo: {
    isNativeCoin: true,
    symbol: "XZNN-Test",
    name: "xZenon-Test",
    decimals: 18,
    address:
      process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_ETH_XZNN_ADDRESS ||
      "0x0000000000000000000000000000000000000000",
  },

  // Internal tokens
  // znnEthLpTokenInfo: {
  //   symbol: "ZNNETHLP",
  //   decimals: 18,
  //   address:
  //     process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_ZNN_ETH_LP_ADDRESS || "zts000000000000000000000000",
  // },
  // qsrEthLpTokenInfo: {
  //   symbol: "QSRETHLP",
  //   decimals: 18,
  //   address:
  //     process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_QSR_ETH_LP_ADDRESS || "zts000000000000000000000000",
  // },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "Supernova-Testnet-ETH",
      chainId: 74506,
      // contractAddress is also known as bridgeAddress
      contractAddress:
        process.env.REACT_APP_PUBLIC_CONSTANTS_SUPERNOVA_TESTNET_LIQUIDITY_EXTERNAL_NETWORK_ETH_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
    },
  },

  GTM_ID: "GTM-XXXXXX",
  TWITTER_EVENT: {
    PIXEL_ID: "xxxxx",
    EVENT_ID: "xx-xxxxx-xxxxxx",
  },
};

let exportedConstants = constants;

console.log("process.env.NODE_ENV", process.env.NODE_ENV);
console.log("process.env.REACT_APP_NETWORK_ENV", process.env.REACT_APP_NETWORK_ENV);

if (process.env.REACT_APP_NETWORK_ENV === "production" || process.env.REACT_APP_NETWORK_ENV === "staging")
  exportedConstants = constants;
if (process.env.REACT_APP_NETWORK_ENV === "development") exportedConstants = developmentConstants;
if (process.env.REACT_APP_NETWORK_ENV === "test") exportedConstants = testConstants;

//
// Supernova
//
if (
  process.env.REACT_APP_NETWORK_ENV === "supernova-production" ||
  process.env.REACT_APP_NETWORK_ENV === "supernova-staging"
)
  exportedConstants = supernovaTestNetConstants;
if (process.env.REACT_APP_NETWORK_ENV === "supernova-test") exportedConstants = supernovaTestNetConstants;

export default exportedConstants;
