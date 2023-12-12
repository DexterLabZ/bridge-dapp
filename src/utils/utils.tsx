/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ethers } from "ethers-ts";
import { Primitives, Zenon } from "znn-ts-sdk";
import { simpleNetworkType, simpleTokenType } from "../pages/wizardSteps/swapStep/swapStep";
import defaultZtsIcon from "./../assets/tokens/zts.svg";
import constants from "./constants";
import { mangle, unmangle } from "./mangling";

export const validateMetamaskNetwork = async (
  provider: ethers.providers.Web3Provider,
  validNetworks: simpleNetworkType[],
  currentChainId = -1
) => {
  console.log("validNetworks", validNetworks);

  if (currentChainId == -1) {
    currentChainId = (await provider.getNetwork()).chainId;
  }
  console.log("Metamask network info", currentChainId);

  const validChainsString = validNetworks
    .filter((v) => v.isAvailable)
    .map((v) => v.name + "(" + v.chainId + ")")
    .toString()
    .replace(",", ", ");

  if (constants.isDevNet) {
    if (!validNetworks.find((net: simpleNetworkType) => net.chainId == currentChainId)) {
      throw `Please select one of these chains from Metamask: ${validChainsString}`;
    }
  }
  if (constants.isTestNet) {
    if (!validNetworks.find((net: simpleNetworkType) => net.chainId == currentChainId)) {
      throw `Please select one of these chains from Metamask: ${validChainsString}`;
    }
  }
  if (constants.isMainNet) {
    if (!validNetworks.find((net: simpleNetworkType) => net.chainId == currentChainId)) {
      throw `Please select one of these chains from Metamask: ${validChainsString}`;
    }
  }
};

export const getZenonWalletInfo = async (zenon: Zenon, address: string) => {
  try {
    const znnAddressObject = Primitives.Address.parse(address);
    console.log("znnAddress", znnAddressObject);

    const getAccountInfoByAddress = await zenon.ledger.getAccountInfoByAddress(znnAddressObject);
    console.log("getAccountInfoByAddress", getAccountInfoByAddress);

    const plasma = await zenon.embedded.plasma.get(znnAddressObject);
    console.log("plasma", plasma);

    getAccountInfoByAddress.plasma = plasma;

    getAccountInfoByAddress.balanceInfoMap = await mapObject(
      getAccountInfoByAddress.balanceInfoMap,
      (tok: simpleTokenType) => {
        if (getAccountInfoByAddress.balanceInfoMap[tok.address]) {
          return {
            ...tok,
            balance: getAccountInfoByAddress.balanceInfoMap[tok.address].balance.toString(),
            balanceWithDecimals: ethers.utils.formatUnits(
              ethers.BigNumber.from(
                (getAccountInfoByAddress.balanceInfoMap[tok.address]?.balance?.toString() || 0) + ""
              ),
              ethers.BigNumber.from(getAccountInfoByAddress.balanceInfoMap[tok.address].token.decimals || 8)
            ),
            address: getAccountInfoByAddress.balanceInfoMap[tok.address].token.tokenStandard,
            symbol: getAccountInfoByAddress.balanceInfoMap[tok.address].token.symbol,
            decimals: getAccountInfoByAddress.balanceInfoMap[tok.address].token.decimals,
          };
        }
        return tok;
      }
    );
    return getAccountInfoByAddress;
  } catch (err) {
    throw err;
  }
};

export const getZenonTokenInfo = async (tokenStandard: string, zenon: any) => {
  console.log("tokenStandard", tokenStandard);
  const tokStandard = Primitives.TokenStandard.parse(tokenStandard);
  console.log("tokStandard", tokStandard);
  console.log("tokStandard.toString()", tokStandard.toString());
  return await zenon.embedded.token.getByZts(tokStandard);
};

export const getInternalTokensDetails = (currentInternalTokens: any, zenon: any) => {
  return Promise.all(
    currentInternalTokens.map(async (tok: any) => {
      const tokenInfo = await getZenonTokenInfo(tok.address, zenon);
      console.log("ZNNtokenInfo", tokenInfo);
      return {
        ...tok,
        symbol: tokenInfo?.symbol,
        decimals: tokenInfo?.decimals,
      };
    })
  );
};

export const getExternalTokensDetails = async (
  currentExternalTokens: simpleTokenType[],
  provider: ethers.providers.Web3Provider
) => {
  return await Promise.all(
    currentExternalTokens.map(async (tok) => {
      console.log("getExternalTokensDetails - tok", tok);
      const newTok = {
        ...tok,
      };
      const metamaskCurrentChainId = (await provider.getNetwork())?.chainId;

      if (
        newTok.isAvailable &&
        metamaskCurrentChainId === newTok.network.chainId &&
        newTok.address &&
        newTok.symbol !== "ETH"
      ) {
        console.log("newTok", JSON.parse(JSON.stringify(newTok)));
        const contract = new ethers.Contract(newTok.address, constants.wznnAbi, provider);
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
        const signedContract = contract.connect(signer);

        if (!newTok.icon) {
          newTok.icon = defaultZtsIcon;
        }

        [newTok.decimals, newTok.symbol, newTok.name] = await Promise.all([
          signedContract.decimals(),
          signedContract.symbol(),
          signedContract.name(),
        ]);

        console.log("updatedTok", newTok);
      }
      return newTok;
    })
  );
};

export const updateTokenPairsWithNewExternalTokens = (currentPairs: any[], newExternalTokens: simpleTokenType[]) => {
  return currentPairs.map((pair: any) => {
    return {
      ...pair,
      externalToken:
        newExternalTokens.find(
          (tok: any) =>
            pair?.externalToken?.address?.toLowerCase() == tok?.address?.toLowerCase() &&
            pair?.externalToken?.network?.chainId == tok?.network?.chainId
        ) || pair.externalToken,
    };
  });
};

export const updateTokenPairsWithNewInternalTokens = (currentPairs: any[], newInternalTokens: simpleTokenType[]) => {
  return currentPairs.map((pair: any) => {
    return {
      ...pair,
      internalToken:
        newInternalTokens.find(
          (tok: any) =>
            pair?.internalToken?.address?.toLowerCase() == tok?.address?.toLowerCase() &&
            pair?.internalToken?.network?.chainId == tok?.network?.chainId
        ) || pair.internalToken,
    };
  });
};

export const getLiquidityPairsDetails = async (liquidityTokenPairs: any[], provider: ethers.providers.Web3Provider) => {
  return await Promise.all(
    liquidityTokenPairs.map(async (pair) => {
      const newPair = {
        ...pair,
      };
      const metamaskCurrentChainId = (await provider.getNetwork())?.chainId;

      // External token network and internal token network should be the same network.
      if (newPair.pairAddress && metamaskCurrentChainId === newPair.pairNetwork.chainId) {
        console.log("getLiquidityPairsDetails-newPair", JSON.parse(JSON.stringify(newPair)));
        const contract = new ethers.Contract(newPair.pairAddress, constants.pairAbi, provider);
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
        const signedContract = contract.connect(signer);

        [newPair.token0, newPair.token1, newPair.symbol, newPair.reserves] = await Promise.all([
          signedContract.token0(),
          signedContract.token1(),
          signedContract.symbol(),
          signedContract.getReserves(),
        ]);

        console.log("getLiquidityPairsDetails-newPair-after-calls", JSON.parse(JSON.stringify(newPair)));

        const reserves = [];

        if (newPair.internalToken.address?.toLowerCase() == newPair.token0?.toLowerCase()) {
          console.log("0.newPair", JSON.parse(JSON.stringify(newPair)));

          reserves[0] = newPair.reserves[0];
          reserves[1] = newPair.reserves[1];

          if (
            (reserves[0] as ethers.BigNumber).isZero() ||
            reserves[0] == 0 ||
            reserves[0] == "0" ||
            (reserves[1] as ethers.BigNumber).isZero() ||
            reserves[1] == 0 ||
            reserves[1] == "0"
          ) {
            newPair.pairParity = 1;
          } else {
            newPair.pairParity = ethers.utils.formatUnits(
              ethers.utils.parseUnits("1", newPair.externalToken?.decimals).mul(reserves[0]).div(reserves[1]),
              newPair.internalToken?.decimals
            );
          }

          newPair.internalToken = {
            ...newPair.internalToken,
            icon: newPair.internalToken?.icon || defaultZtsIcon,
            address: newPair.token0,
            // Is token0 or token1
            uniswapTokenIndex: 0,
            isAvailable: true,
          };

          newPair.externalToken = {
            ...newPair.externalToken,
            icon: newPair.externalToken?.icon || defaultZtsIcon,
            address: newPair.token1,
            // Is token0 or token1
            uniswapTokenIndex: 1,
            isAvailable: true,
          };
        } else if (newPair.externalToken.address == newPair.token0) {
          console.log("1. newPair", JSON.parse(JSON.stringify(newPair)));

          reserves[0] = newPair.reserves[0];
          reserves[1] = newPair.reserves[1];

          if (
            (reserves[0] as ethers.BigNumber).isZero() ||
            reserves[0] == 0 ||
            reserves[0] == "0" ||
            (reserves[1] as ethers.BigNumber).isZero() ||
            reserves[1] == 0 ||
            reserves[1] == "0"
          ) {
            newPair.pairParity = 1;
          } else {
            newPair.pairParity = ethers.utils.formatUnits(
              ethers.utils.parseUnits("1", newPair.externalToken?.decimals).mul(reserves[1]).div(reserves[0]),
              newPair.internalToken?.decimals
            );
          }
          newPair.internalToken = {
            ...newPair.internalToken,
            icon: newPair.internalToken?.icon || defaultZtsIcon,
            address: newPair.token1,
            // Is token0 or token1
            uniswapTokenIndex: 1,
            isAvailable: true,
          };
          newPair.externalToken = {
            ...newPair.externalToken,
            icon: newPair.externalToken?.icon || defaultZtsIcon,
            address: newPair.token0,
            // Is token0 or token1
            uniswapTokenIndex: 0,
            isAvailable: true,
          };
        }
        console.log("3.newPair", JSON.parse(JSON.stringify(newPair)));

        reserves[0] = newPair.reserves[0];
        reserves[1] = newPair.reserves[1];

        console.log("reserves", reserves);
        console.log(
          "reserves.toString",
          reserves.map((v) => v.toString())
        );

        console.log("pairParity", newPair.pairParity.toString());

        newPair.reserves = reserves.map((v) => v.toString());

        delete newPair.reserves;
        delete newPair.symbol;

        console.log("newPair at the end", newPair);
      }
      return newPair;
    })
  );
};

export const updateExternalLiquidityTokensBasedOnTokenPairs = (
  externalLiquidityTokens: any[],
  liquidityTokenPairs: any[]
) => {
  liquidityTokenPairs.map((pair: any) => {
    const tokIndex = externalLiquidityTokens.findIndex(
      (tok: any) =>
        tok.address?.toLowerCase() == pair.externalToken.address?.toLowerCase() ||
        tok.symbol === pair.externalToken.symbol
    );
    if (tokIndex !== -1) {
      console.log("updateExternalLiquidityTokensBasedOnTokenPairs - Found", externalLiquidityTokens[tokIndex]);
      console.log("updateExternalLiquidityTokensBasedOnTokenPairs - Found", pair?.externalToken);
      console.log("updateExternalLiquidityTokensBasedOnTokenPairs - pair", pair);
      externalLiquidityTokens[tokIndex] = pair?.externalToken;
    }
  });
  return externalLiquidityTokens;
};

export const updateInternalLiquidityTokensBasedOnTokenPairs = (
  internalLiquidityTokens: any[],
  liquidityTokenPairs: any[]
) => {
  liquidityTokenPairs.map((pair: any) => {
    const tokIndex = internalLiquidityTokens.findIndex(
      (tok: any) =>
        tok.address?.toLowerCase() == pair.internalToken.address?.toLowerCase() ||
        tok.symbol === pair.internalToken.symbol
    );
    if (tokIndex !== -1) {
      console.log("updateInternalLiquidityTokensBasedOnTokenPairs - Found", internalLiquidityTokens[tokIndex]);
      console.log("updateInternalLiquidityTokensBasedOnTokenPairs - Found", pair?.internalToken);
      console.log("updateExternalLiquidityTokensBasedOnTokenPairs - pair", pair);
      internalLiquidityTokens[tokIndex] = pair?.internalToken;
    }
  });
  return internalLiquidityTokens;
};

export const checkSyriusAvailability = () => {
  // @ts-ignore
  if (!(typeof window.zenon !== "undefined")) {
    // @ts-ignore
    if (!!window.chrome) {
      setTimeout(() => {
        const newWindow = window.open(constants.officialSyriusExtensionUrl, "_blank");
        if (newWindow) newWindow.opener = null;
      }, 2500);
      throw "Please install Syrius Browser Extension. Redirecting to download page...";
    } else {
      throw "Syrius extension is only available on Chromium based browsers.";
    }
  } else {
    // @ts-ignore
    if (!window.zenon.isSyriusExtension) {
      // @ts-ignore
      if (!!window.chrome) {
        setTimeout(() => {
          const newWindow = window.open(constants.officialSyriusExtensionUrl, "_blank");
          if (newWindow) newWindow.opener = null;
        }, 2500);
        throw "Please install Syrius Browser Extension. Redirecting to download page...";
      } else {
        throw "Syrius extension is only available on Chromium based browsers.";
      }
    }
  }
};

export const checkMetamaskAvailability = () => {
  if (!(typeof window.ethereum !== "undefined")) {
    // @ts-ignore
    if (!!window.chrome) {
      setTimeout(() => {
        const newWindow = window.open(constants.officialMetamaskExtensionUrl, "_blank");
        if (newWindow) newWindow.opener = null;
      }, 2500);
      throw "Please install Metamask. Redirecting to extension...";
    } else {
      throw "Please install Metamask Extension.";
    }
  } else {
    if (!window?.ethereum?.isMetaMask) {
      // @ts-ignore
      if (!!window.chrome) {
        setTimeout(() => {
          const newWindow = window.open(constants.officialMetamaskExtensionUrl, "_blank");
          if (newWindow) newWindow.opener = null;
        }, 2500);
        throw "Please install Metamask. Redirecting to extension...";
      } else {
        throw "Please install Metamask Extension.";
      }
    }
  }
};

export const mapObject = async (obj: any, func: any) => {
  return Object.fromEntries(await Promise.all(Object.entries(obj).map(async ([k, v]) => [k, await func(v)])));
};

export const findInObject = (obj: any, func: any) => {
  const toArray = Object.keys(obj).map((key: string) => obj[key]);
  return toArray.find(func);
};

export const secondsToDuration = function (seconds: number) {
  // Days
  const days = Math.floor(seconds / (24 * 3600));
  seconds -= days * 24 * 3600;

  // Hours
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;

  // Minutes
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  return `${days > 0 ? (days > 9 ? days : "0" + days) + " days" : ""} ${hours > 9 ? hours : "0" + hours}:${
    minutes > 9 ? minutes : "0" + minutes
  }:${seconds > 9 ? seconds.toFixed(0) : "0" + seconds.toFixed(0)}`;
};

export const hasLowPlasma = (currentPlasma: number | undefined) => {
  if (currentPlasma) {
    if (currentPlasma < 75000) return true;
    else return false;
  } else return false;
};

export const addBigNumberStrings = (terms: string[]) => {
  try {
    return terms.reduce((prevSum, currentValue) => {
      if (!prevSum) return currentValue;
      const prevSumBN = ethers.utils.parseUnits(prevSum, 18);
      const currentValueBN = ethers.utils.parseUnits(currentValue, 18);
      const currentSumBN = prevSumBN.add(currentValueBN);
      return ethers.utils.formatUnits(currentSumBN, 18);
    });
  } catch (err) {
    console.error("Error addBigNumberStrings", err);
    return "0";
  }
};

export const subtractBigNumberStrings = (terms: string[]) => {
  try {
    return terms.reduce((prevDifference, currentValue) => {
      if (!prevDifference) return currentValue;
      const prevDifferenceBN = ethers.utils.parseUnits(prevDifference, 18);
      const currentValueBN = ethers.utils.parseUnits(currentValue, 18);
      const currentDifferenceBN = prevDifferenceBN.sub(currentValueBN);
      return ethers.utils.formatUnits(currentDifferenceBN, 18);
    });
  } catch (err) {
    console.error("Error subtractBigNumberStrings", err);
    return "0";
  }
};

export const multiplyBigNumberStrings = (terms: string[], maxDecimals = 18) => {
  try {
    return terms
      .reduce((prevProduct, currentValue) => {
        if (!prevProduct) return currentValue;
        const prevProductBN = ethers.utils.parseUnits(prevProduct, 18);
        const currentValueBN = ethers.utils.parseUnits(currentValue, 18);
        const oneBN = ethers.utils.parseUnits("1", 18);
        const result = ethers.utils.formatUnits(prevProductBN.mul(currentValueBN).div(oneBN), 18);
        return result;
      })
      .substring(0, maxDecimals);
  } catch (err) {
    console.error("Error multiplyBigNumberStrings", err);
    return "0";
  }
};

export const divideBigNumberStrings = (terms: string[], maxDecimals = 18) => {
  try {
    return terms
      .reduce((prevQuotient, currentValue) => {
        if (!prevQuotient) return currentValue;
        const prevQuotientBN = ethers.utils.parseUnits(prevQuotient, 18);
        const currentValueBN = ethers.utils.parseUnits(currentValue, 18);
        const oneBN = ethers.utils.parseUnits("1", 18);
        const result = ethers.utils.formatUnits(prevQuotientBN.mul(oneBN).div(currentValueBN), 18);
        return result;
      })
      .substring(0, maxDecimals);
  } catch (err) {
    console.error("Error divideBigNumberStrings", err);
    return "0";
  }
};

export const mangleReferralCode = (code: string) => {
  const key = "UjFpyVLBUHC";
  const mangled: string = mangle(code, key);
  return mangled;
};

export const unmangleReferralCode = (code: string) => {
  const key = "UjFpyVLBUHC";
  const unmangled: string = unmangle(code, key);
  return unmangled;
};

export const getReferralAddress = () => {
  const mangledCode = localStorage.getItem("znn-referral-code");
  if (mangledCode) {
    return unmangleReferralCode(mangledCode);
  } else {
    return "";
  }
};

export const setReferralCodeAddress = (address: string) => {
  const mangledCode = mangleReferralCode(address);
  if (mangledCode) {
    return localStorage.setItem("znn-referral-code", mangledCode);
  } else {
    throw "Unable to mangle referral code";
  }
};

export const openSafelyInNewTab = (url: string): void => {
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (newWindow) newWindow.opener = null;
};
