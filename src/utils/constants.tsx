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
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "0x7aaa4628d9a9b4a6f809b5ad4f5e62cfe703efe9",
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
  znnEthLpsTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: "zts17d6yr02kh0r9qr566p7tg6",
  },
  qsrEthLpsTokenInfo: {
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

  GTM_ID: 'GTM-TC768WT'
};

//
// TEST ENV CONSTANTS
//
const testConstants = {
  ...constants,
  isMainNet: false,
  isDevNet: false,
  isTestNet: true,

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
    address: "0x0000000000000000000000000000000000000000",
  },
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "0x0000000000000000000000000000000000000000",
  },

  // Internal tokens
  znnEthLpsTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: "zts1y54lmvqgntdpgpzlmp45cm",
  },
  qsrEthLpsTokenInfo: {
    symbol: "QSRETHLP",
    decimals: 18,
    address: "zts1akfzw3s3h6ytwm07x9mldh",
  },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "TEST-ETH",
      chainId: 31337,
      // contractAddress is also known as bridgeAddress
      contractAddress: "0x0000000000000000000000000000000000000000",
    },
  },

  // Liquidity pairs
  defaultLiquidityPairsDetails: {
    ETH: {
      wethTokenAddress: "0x0000000000000000000000000000000000000000",
      // LP Token address is the same as pair address
      lpTokenAddress: "0x0000000000000000000000000000000000000000",
      pairAddress: "0x0000000000000000000000000000000000000000",
      // Router
      routerContract: "0x0000000000000000000000000000000000000000",
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
};

//
// DEV ENV CONSTANTS
//
const developmentConstants = {
  ...constants,
  isMainNet: false,
  isDevNet: true,
  isTestNet: false,

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
    address: "0x0000000000000000000000000000000000000000",
  },
  bscWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "",
  },
  ethWqsrTokenInfo: {
    symbol: "wQSR",
    decimals: 8,
    address: "0x0000000000000000000000000000000000000000",
  },

  // Internal tokens
  znnEthLpsTokenInfo: {
    symbol: "ZNNETHLP",
    decimals: 18,
    address: "zts1dt5pxzwpvp2vrl6ewd728g",
  },
  qsrEthLpsTokenInfo: {
    symbol: "QSRETHLP",
    decimals: 18,
    address: "zts1akfzw3s3h6ytwm07x9mldh",
  },

  // Liquidity networks
  defaultLiquidityExternalNetworkDetails: {
    ETH: {
      name: "DEV-ETH",
      chainId: 31337,
      // contractAddress is also known as bridgeAddress
      contractAddress: "0x0000000000000000000000000000000000000000",
    },
  },

  // Liquidity pairs
  defaultLiquidityPairsDetails: {
    ETH: {
      wethTokenAddress: "0x0000000000000000000000000000000000000000",
      // LP Token address is the same as pair address
      lpTokenAddress: "0x0000000000000000000000000000000000000000",
      pairAddress: "0x0000000000000000000000000000000000000000",
      // Router
      routerContract: "0x0000000000000000000000000000000000000000",
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
};

let exportedConstants = constants;

console.log("process.env.NODE_ENV", process.env.NODE_ENV);
console.log("process.env.REACT_APP_NETWORK_ENV", process.env.REACT_APP_NETWORK_ENV);

if (process.env.REACT_APP_NETWORK_ENV === "production") exportedConstants = constants;
if (process.env.REACT_APP_NETWORK_ENV === "development") exportedConstants = developmentConstants;
if (process.env.REACT_APP_NETWORK_ENV === "test") exportedConstants = testConstants;

export default exportedConstants;
