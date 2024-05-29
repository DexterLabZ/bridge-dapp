import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { FC, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import infoIcon from "../../../assets/info-icon.svg";
import spinnerSvg from "./../../../assets/spinner.svg";
import TokenDropdown from "../../../components/tokenDropdown/tokenDropdown";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import { storeGlobalConstants } from "../../../services/redux/globalConstantsSlice";
import { storeErcInfo } from "../../../services/redux/walletSlice";
import constants from "../../../utils/constants";
import {
  divideBigNumberStrings,
  getExternalTokensDetails,
  getLiquidityPairsDetails,
  multiplyBigNumberStrings,
  updateExternalLiquidityTokensBasedOnTokenPairs,
  updateInternalLiquidityTokensBasedOnTokenPairs,
  updateTokenPairsWithNewExternalTokens,
  updateTokenPairsWithNewInternalTokens,
  validateExternalNetwork,
} from "../../../utils/utils";
import useExternalNetwork from "../../../services/hooks/externalNetwork-provider/useExternalNetwork";
import { externalNetworkProviderTypes } from "../../../services/hooks/externalNetwork-provider/externalNetworkContext";

export type simpleTokenType = {
  icon: string;
  symbol: string;
  name: string;
  address: string;
  balance?: string;
  balanceWithDecimals?: string;
  minAmountWithDecimals?: string;
  minAmount?: string;
  decimals: number;
  isAvailable: boolean;
  isCommonToken?: boolean;
  network: simpleNetworkType;
};

export type simpleNetworkType = {
  name: string;
  chainId: number;
  contractAddress?: string;
  networkClass?: number;
  isAvailable: boolean;
  icon?: any;
  color?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AddLiquidityStep: FC<{ onStepSubmit: () => void }> = ({ onStepSubmit }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ mode: "onChange" });

  const { handleSpinner } = useContext(SpinnerContext);

  const dispatch = useDispatch();
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const defaultNextButtonLabel = "Add Liquidity";
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const [isLoadingMetamaskInfo, setIsLoadingMetamaskInfo] = useState(false);

  const [nextButtonLabel, setNextButtonLabel] = useState(defaultNextButtonLabel);
  const externalExplorerByChainId: { [index: number]: string } = constants.externalNetworkExplorerURLbyChainId;

  const [maxSlippagePercentage, setMaxSlippagePercentage] = useState(1);
  const [zenonAmount, setZenonAmount] = useState("");
  const [zenonBalance, setZenonBalance] = useState("0");
  const [zenonAddress, setZenonAddress] = useState("");
  const [isZenonBalanceLoading, setIsZenonBalanceLoading] = useState(false);
  const [zenonToken, setZenonToken] = useState<simpleTokenType>({
    icon: "",
    symbol: "",
    name: "",
    address: "",
    balance: "0",
    decimals: 8,
    network: {
      name: "ZNN",
      chainId: 0,
      icon: "",
      isAvailable: false,
    },
    isCommonToken: false,
    isAvailable: false,
  });

  const [ercAmount, setErcAmount] = useState("");
  const [ercBalance, setErcBalance] = useState("0");
  const [isErcBalanceLoading, setIsErcBalanceLoading] = useState(false);
  const [ercAddress, setErcAddress] = useState("");
  const [ercToken, setErcToken] = useState<simpleTokenType>({
    icon: "",
    name: "",
    symbol: "",
    address: "",
    balance: "0",
    decimals: 8,
    network: {
      name: "ZNN",
      chainId: 0,
      icon: "",
      isAvailable: false,
    },
    isCommonToken: false,
    isAvailable: false,
  });
  const [tokenParity, setTokenParity] = useState(1);

  const [isValidated, setIsValidated] = useState(false);
  const globalConstants = useSelector((state: any) => state.globalConstants);

  const [internalFilteredNetworks, setInternalFilteredNetworks] = useState(globalConstants.liquidityInternalNetworks);
  const [externalFilteredNetworks, setExternalFilteredNetworks] = useState(globalConstants.liquidityExternalNetworks);
  const [internalFilteredTokens, setInternalFilteredTokens] = useState(globalConstants.liquidityInternalTokens);
  const [externalFilteredTokens, setExternalFilteredTokens] = useState(globalConstants.liquidityExternalTokens);

  const [preselectedInternalTokenSearch, setPreselectedInternalTokenSearch] = useState("");
  const [preselectedExternalTokenSearch, setPreselectedExternalTokenSearch] = useState("");

  const externalNetworkConnectionDetails = useSelector((state: any) => state.externalNetworkConnection);

  const { externalNetworkClient } = useExternalNetwork();

  useEffect(() => {
    const runAsyncTasks = async () => {
      console.log("addLiqAddLiquidityStep globalConstants", globalConstants);
      let metamaskCurrentChainId: number;
      let defaultToken: any;
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        metamaskCurrentChainId = (await provider.getNetwork())?.chainId;
        await validateExternalNetwork(provider, globalConstants.liquidityExternalNetworks, metamaskCurrentChainId);
        console.log("metamaskCurrentChainId", metamaskCurrentChainId);
        console.log("globalConstants.liquidityExternalTokens", globalConstants.liquidityExternalTokens);
        defaultToken = globalConstants.liquidityExternalTokens.find((tok: any) => tok.isAvailable && !tok.address);
        if (!defaultToken) {
          defaultToken = globalConstants.liquidityExternalTokens.find(
            (tok: any) => tok.isAvailable && metamaskCurrentChainId === tok.network.chainId
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!defaultToken) {
          defaultToken = globalConstants.liquidityExternalTokens.find((tok: any) => tok.isAvailable);
        }
      }

      console.log("defaultToken", defaultToken);

      const ercTok = {
        ...(globalConstants.liquidityExternalTokens.find(
          (tok: any) => tok.symbol == ercToken.symbol && tok.network.chainId === metamaskCurrentChainId
        ) || defaultToken),
        balance: JSONbig.parse(serializedWalletInfo["ercInfo"]).balance,
      };
      console.log("init ercToken", ercTok);
      setValue("ercToken", ercTok, { shouldValidate: true });
      setErcToken(ercTok);

      console.log(
        "getPairOfToken(defaultToken.address, defaultToken?.network?.chainId)",
        getPairOfToken(defaultToken.address, defaultToken.network.chainId)
      );
      console.log("defaultToken", defaultToken);
      console.log("JSONbig.parse(serializedWalletInfo['zenonInfo'])", JSONbig.parse(serializedWalletInfo["zenonInfo"]));

      const localToken = globalConstants.liquidityInternalTokens.find(
        (tok: any) =>
          tok.address?.toLowerCase() ===
          getPairOfToken(defaultToken.address, defaultToken.network.chainId).address?.toLowerCase()
      );
      const znnTok = {
        ...localToken,
        balance: Number(
          ethers.utils.formatUnits(
            ethers.BigNumber.from((localToken?.balance || 0) + ""),
            ethers.BigNumber.from(localToken?.decimals || 8)
          )
        ),
      };
      console.log("init zenonToken", znnTok);
      setTokenParity(getParityOfPair(znnTok.address, ercTok.address));

      setValue("zenonToken", znnTok, { shouldValidate: true });
      setZenonToken(znnTok);
    };

    runAsyncTasks();
  }, []);

  useEffect(() => {
    console.log("useEffect, zenonToken", zenonToken);
    if (ercToken.symbol && zenonToken.symbol && !isLoadingMetamaskInfo) {
      const doAsyncUpdates = async () => {
        setIsZenonBalanceLoading(true);
        updateZenonInfoToFrontend((await getInternalWalletInfo(false))?.zenonInfo);
        await updatePair();
        setIsZenonBalanceLoading(false);
      };
      console.log("zenonToken, doAsyncUpdates");
      doAsyncUpdates();
    }
  }, [zenonToken]);

  useEffect(() => {
    console.log("useEffect, ercToken", ercToken);
    if (zenonToken.symbol && ercToken.symbol && !isLoadingMetamaskInfo) {
      const doAsyncUpdates = async () => {
        setIsErcBalanceLoading(true);
        updateMetamaskInfoToFrontend((await getInternalWalletInfo(false))?.ercInfo);
        await updatePair();
        setIsErcBalanceLoading(false);
      };
      console.log("ercToken, doAsyncUpdates");
      doAsyncUpdates();
    }
  }, [ercToken]);

  useEffect(() => {
    console.log("walletDetails - wallet changed");
    console.log("serializedWalletInfo", serializedWalletInfo);

    const newZenonAddress = JSONbig.parse(serializedWalletInfo["zenonInfo"] || "{}")?.address || "";
    console.log("zenonAddress", zenonAddress);
    console.log("newZenonAddress", newZenonAddress);
    if (newZenonAddress?.toLowerCase() !== zenonAddress?.toLowerCase()) {
      setZenonAddress(newZenonAddress);
    }

    const newErcAddress = JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}")?.address || "";
    console.log("ercAddress", ercAddress);
    console.log("newErcAddress", newErcAddress);
    if (newErcAddress?.toLowerCase() !== ercAddress?.toLowerCase()) {
      setErcAddress(newErcAddress);
    }
  }, [serializedWalletInfo]);

  useEffect(() => {
    const runAsyncTasks = async () => {
      console.log("new ercAddress or chainId", ercAddress, externalNetworkConnectionDetails);
      if (ercToken?.symbol && zenonToken?.symbol) {
        const metaInfo = await getInternalWalletInfo(false);
        updateMetamaskInfoToFrontend(metaInfo?.ercInfo);
        updateZenonInfoToFrontend(metaInfo?.zenonInfo);
      }
    };
    runAsyncTasks();
  }, [ercAddress, externalNetworkConnectionDetails.chainId]);

  const applySlippage = (value: ethers.BigNumber, slippagePercentage: number) => {
    const oneBN = ethers.utils.parseUnits("1", 18);
    const slippagePercentageBN = ethers.utils.parseUnits((1 - slippagePercentage / 100).toString(), 18);

    return value.mul(slippagePercentageBN).div(oneBN);
  };

  const getInternalWalletInfo = async (showToastNotification = true) => {
    try {
      console.log("getInternalWalletInfo");
      setIsLoadingMetamaskInfo(true);
      const provider = await externalNetworkClient.getProvider();
      await validateExternalNetwork(provider, globalConstants.liquidityExternalNetworks);

      console.log("ercToken", JSONbig.stringify(ercToken));
      console.log("zenonToken", JSONbig.stringify(zenonToken));
      console.log("globalConstants", JSONbig.parse(JSONbig.stringify(globalConstants) + ""));

      const externalLiquidityTokens = await getExternalTokensDetails(globalConstants.liquidityExternalTokens, provider);
      let updatedLiquidityTokenPairs = updateTokenPairsWithNewExternalTokens(
        globalConstants.liquidityTokenPairs,
        externalLiquidityTokens
      );
      console.log("externalLiquidityTokens", externalLiquidityTokens);
      console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

      console.log(
        "0. internalLiquidityTokens",
        JSONbig.parse(JSONbig.stringify(globalConstants.liquidityInternalTokens))
      );
      // We do this because even if they are called internal tokens, they are still ERC-20 tokens
      const internalLiquidityTokens = await getExternalTokensDetails(globalConstants.liquidityInternalTokens, provider);
      updatedLiquidityTokenPairs = updateTokenPairsWithNewInternalTokens(
        globalConstants.liquidityTokenPairs,
        internalLiquidityTokens
      );
      console.log("1. internalLiquidityTokens", internalLiquidityTokens);
      console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

      const liquidityTokenPairs: any = await getLiquidityPairsDetails(updatedLiquidityTokenPairs, provider);
      console.log("getLiquidityPairsDetails", liquidityTokenPairs);

      const availableExternalLiquidityTokens = updateExternalLiquidityTokensBasedOnTokenPairs(
        externalLiquidityTokens,
        liquidityTokenPairs
      );
      console.log("availableExternalLiquidityTokens", availableExternalLiquidityTokens);
      const availableInternalLiquidityTokens = updateInternalLiquidityTokensBasedOnTokenPairs(
        internalLiquidityTokens,
        liquidityTokenPairs
      );
      console.log("availableInternalLiquidityTokens", availableInternalLiquidityTokens);

      const updatedConstants = {
        ...globalConstants,
        liquidityExternalTokens: availableExternalLiquidityTokens,
        liquidityInternalTokens: availableInternalLiquidityTokens,
        liquidityTokenPairs: liquidityTokenPairs,
      };

      dispatch(storeGlobalConstants(updatedConstants));

      console.log("updatedConstants after metamask data", updatedConstants);
      console.log("updatedConstants", updatedConstants);

      const walletInfo = await externalNetworkClient.getWalletInfo(provider);

      console.log("ercToken", JSONbig.stringify(ercToken));
      console.log("zenonToken", JSONbig.stringify(zenonToken));

      const currentErcToken = ercToken.symbol
        ? ercToken
        : updatedConstants.liquidityExternalTokens.find(
            (tok: any) => tok.isAvailable == true && walletInfo?.chainId === tok.network.chainId
          );

      console.log("currentErcToken", JSONbig.stringify(currentErcToken));

      const currentZenonToken = zenonToken.symbol
        ? zenonToken
        : updatedConstants.liquidityInternalTokens.find(
            (tok: any) => tok.isAvailable == true && walletInfo?.chainId === tok.network.chainId
          );

      console.log("currentZenonToken", JSONbig.stringify(currentZenonToken));

      const ercInfo = {
        address: walletInfo.address?.toLowerCase(),
        balance: "0",
        rawBalance: ethers.BigNumber.from("0"),
      };
      const zenonInfo = {
        address: walletInfo.address?.toLowerCase(),
        balance: "0",
        rawBalance: ethers.BigNumber.from("0"),
      };

      // ToDo: Maybe replace this verification with currentToken.isNativeCoin and add it to
      // the getBalance() parameters
      if (currentErcToken.symbol == "ETH" && currentErcToken.address == "") {
        const rawErcBalance = await externalNetworkClient.getBalance(null, null, true, provider);

        console.log("rawErcBalance - ", currentErcToken.symbol, ":", rawErcBalance);
        ercInfo.balance = ethers.utils.formatUnits(rawErcBalance, currentErcToken.decimals);
        console.log("eth - balance, decimals", ercInfo.balance, currentErcToken.decimals);
        ercInfo.rawBalance = rawErcBalance;
      } else {
        const rawErcBalance = await externalNetworkClient.getBalance(
          currentErcToken.address,
          updatedConstants.wznnAbi,
          currentErcToken?.isNativeCoin,
          provider
        );

        console.log("rawErcBalance - ", currentErcToken.symbol, ":", rawErcBalance);
        ercInfo.balance = ethers.utils.formatUnits(rawErcBalance, currentErcToken.decimals);
        console.log("weth - balance, decimals", ercInfo.balance, currentErcToken.decimals);
        ercInfo.rawBalance = rawErcBalance;
      }
      console.log("afterMetamaskUpdated - ercInfo", JSONbig.stringify(ercInfo));

      const rawWznnBalance = await externalNetworkClient.getBalance(
        currentZenonToken.address,
        updatedConstants.wznnAbi,
        currentZenonToken?.isNativeCoin,
        provider
      );

      console.log("rawWznnBalance - ", currentZenonToken.symbol, ":", rawWznnBalance);
      zenonInfo.balance = ethers.utils.formatUnits(rawWznnBalance, currentZenonToken.decimals);
      console.log("weth - balance, decimals", zenonInfo.balance, currentZenonToken.decimals);
      zenonInfo.rawBalance = rawWznnBalance;

      console.log("afterMetamaskUpdated - zenonInfo", JSONbig.stringify(zenonInfo));

      if (showToastNotification) {
        toast("Metamask account updated", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });
      }
      return { ercInfo, zenonInfo };
    } catch (err) {
      console.error(err);
      toast(err + "", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
    } finally {
      setIsLoadingMetamaskInfo(false);
    }
  };

  const updateMetamaskInfoToFrontend = (ercInfo: any) => {
    console.log("ercInfo", ercInfo);
    if (ercInfo) {
      dispatch(storeErcInfo(JSONbig.stringify(ercInfo)));
      setValue("ercAddress", ercInfo?.address, { shouldValidate: true });
      setErcAddress(ercInfo?.address);
      setErcBalance(ercInfo.balance);
    }
  };

  const updateZenonInfoToFrontend = (zenonInfo: any) => {
    console.log("updateZenonInfoToFrontend - zenonInfo", zenonInfo);

    if (zenonInfo) {
      setZenonBalance(zenonInfo.balance);
    }
  };

  const updatePair = async () => {
    console.log("updatePair", updatePair);
    console.log("ercToken", ercToken);
    console.log("zenonToken", zenonToken);

    if (ercToken.symbol && zenonToken.symbol) {
      const currentContractAddress = globalConstants.liquidityExternalNetworks.find(
        (net: any) => net.chainId == ercToken.network.chainId
      ).contractAddress;
      console.log("currentContractAddress", currentContractAddress);

      console.log("ercToken.address", ercToken.address);
      console.log("globalConstants", globalConstants);
      console.log("zenonToken.address", zenonToken.address);
      console.log("ercToken.address", ercToken.address);

      const currentPair = globalConstants.liquidityTokenPairs.find(
        (pair: any) =>
          pair.internalToken.address?.toLowerCase() == zenonToken.address?.toLowerCase() &&
          pair.externalToken.symbol == ercToken.symbol
      );

      console.log("currentPair", currentPair);
      console.log("globalConstants.liquidityTokenPairs", globalConstants.liquidityTokenPairs);
      console.log("zenonToken.address", zenonToken.address);
      console.log("ercToken.address", ercToken.address);
    }
  };

  const getParityOfPair = (internalTokenAddress: string, externalTokenAddress: string) => {
    console.log("getParityOfPair - internalTokenAddress", internalTokenAddress);
    console.log("getParityOfPair - externalTokenAddress", externalTokenAddress);
    console.log("getParityOfPair - globalConstants.liquidityTokenPairs", globalConstants.liquidityTokenPairs);

    // ETH is the only token without address
    // TODO: Maybe find a way to create an unique identifier that doesn't rely on the absence of the address property
    if (!externalTokenAddress)
      return globalConstants.liquidityTokenPairs.find(
        (pair: any) => pair.internalToken.address?.toLowerCase() == internalTokenAddress?.toLowerCase()
      )?.pairParity;

    return globalConstants.liquidityTokenPairs.find(
      (pair: any) =>
        pair.internalToken.address?.toLowerCase() == internalTokenAddress?.toLowerCase() &&
        pair.externalToken.address?.toLowerCase() == externalTokenAddress?.toLowerCase()
    )?.pairParity;
  };

  const getPairOfToken = (address: string, destinationChainId = -1) => {
    // ETH is the only token without address
    // TODO: Maybe find a way to create an unique identifier that doesn't rely on the absence of the address property
    if (!address) return globalConstants.liquidityTokenPairs[0]?.internalToken;

    console.log("getPairOfToken - address", address);
    console.log("getPairOfToken - destinationChainId", destinationChainId);
    return (
      globalConstants.liquidityTokenPairs.find(
        (pair: any) => pair.internalToken.address?.toLowerCase() == address?.toLowerCase()
      )?.externalToken ||
      globalConstants.liquidityTokenPairs.find(
        (pair: any) =>
          pair.externalToken.address?.toLowerCase() == address?.toLowerCase() &&
          pair?.externalToken?.network?.chainId == destinationChainId
      )?.internalToken
    );
  };

  const onZenonDropdownChange = async (token: any) => {
    console.log("onZenonDropdownChange", token);
    setValue("zenonToken", token, { shouldValidate: true });

    setZenonToken(token);

    const pairedToken = getPairOfToken(token.address);
    console.log("pairedToken", pairedToken);

    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting to change network in Metamask</div>
      </>,
      "extension-approval-spinner-root"
    );
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkInfo = await provider.getNetwork();
      if (pairedToken.network.chainId !== networkInfo.chainId) {
        setIsNextDisabled(true);
        setNextButtonLabel("Loading...");
        showSpinner(true);
        await window?.ethereum?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.utils.hexValue(pairedToken.network.chainId) }], // chainId must be in hexadecimal numbers
        });

        toast("Network changed", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });
      } else {
        showSpinner(false);
      }
    } catch (err) {
      toast("Failed to change network", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });

      console.error(err);
    } finally {
      showSpinner(false);
      setIsNextDisabled(false);
      setNextButtonLabel(defaultNextButtonLabel);
      setTokenParity(getParityOfPair(token.address, pairedToken.address));
      setValue("ercToken", pairedToken, { shouldValidate: true });
      setErcToken(pairedToken);
      setPreselectedExternalTokenSearch(token.symbol);
    }
  };

  const onErcDropdownChange = async (token: any) => {
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting to change network in Metamask</div>
      </>,
      "extension-approval-spinner-root"
    );
    try {
      setIsNextDisabled(true);
      setNextButtonLabel("Loading...");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkInfo = await provider.getNetwork();
      console.log("networkInfo", networkInfo);

      if (token.network.chainId !== networkInfo.chainId) {
        await externalNetworkClient.requestNetworkSwitch(token.network.chainId);

        toast("Network changed", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });
      }

      setValue("ercToken", token, { shouldValidate: true });
      setErcToken(token);

      console.log("Token", token);

      const pairedToken = getPairOfToken(token.address, token?.network?.chainId);

      console.log("pairedToken", pairedToken);

      setTokenParity(getParityOfPair(pairedToken.address, token.address));
      setValue("zenonToken", pairedToken, { shouldValidate: true });
      setZenonToken(pairedToken);
    } catch (err) {
      toast("Failed to change network", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
      });
      console.error(err);
    } finally {
      showSpinner(false);
      setIsNextDisabled(false);
      setNextButtonLabel(defaultNextButtonLabel);
    }
    console.log("onErcDropdownChange", token);
  };

  const updateZenonAmount = (amount: string, alsoUpdatePair = true) => {
    console.log("updateZenonAmount", amount);

    setZenonAmount(amount);
    setValue("zenonAmountField", amount, { shouldValidate: true });

    if (alsoUpdatePair) {
      updateErcAmount(divideBigNumberStrings([amount, tokenParity.toString()]), false);
    }
  };

  const updateErcAmount = (amount: string, alsoUpdatePair = true) => {
    console.log("updateErcAmount", amount);

    setErcAmount(amount);
    setValue("ercAmountField", amount, { shouldValidate: true });

    if (alsoUpdatePair) {
      updateZenonAmount(multiplyBigNumberStrings([amount, tokenParity.toString()]), false);
    }
  };

  const addTokenToMetamask = async (token: simpleTokenType) => {
    if (typeof window.ethereum !== "undefined") {
      try {
        if (token.address == "" && token.symbol == "ETH") {
          throw new Error("Token already present");
        }
        const wasAdded = await window?.ethereum?.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20", // Initially only supports ERC20, but eventually more!
            options: {
              address: token.address, // The address that the token is at.
              symbol: token.symbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: token.decimals, // The number of decimals in the token
              image: token.icon, // A string url of the token logo
            },
          },
        });

        if (wasAdded) {
          toast("Token successfully added", {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "success",
            theme: "dark",
          });
        } else {
          toast("Failed to add token", {
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
      } catch (error: any) {
        console.error(error);
        toast(error?.message + "", {
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
    }
  };

  const addLiquidityToPool = async () => {
    await startLiquidityFlow();
  };

  const disableAddingLiquidity = (
    currentLimit: ethers.BigNumber,
    currentReserve: ethers.BigNumber,
    decimals: number
  ) => {
    console.warn(
      "limit reached",
      ethers.utils.formatUnits(currentReserve, decimals),
      ">=",
      ethers.utils.formatUnits(currentLimit, decimals)
    );

    const formattedLimit = ethers.utils.formatUnits(currentLimit, decimals).split(".")[0];
    // const formattedReserve = ethers.utils.formatUnits(currentReserve, decimals).split(".")[0];
    const difference = currentReserve.sub(currentLimit);
    const formattedDifference = ethers.utils.formatUnits(difference, decimals).split(".")[0];

    setIsNextDisabled(true);
    setNextButtonLabel("Max liquidity reached !");

    toast(
      <div>
        <div>
          The liquidity limit of {formattedLimit} wZNN has been reached. To add more liquidity, at least{" "}
          {formattedDifference} wZNN need to be bought.
        </div>
        <a className="no-decoration" href={globalConstants.buyZnnLandingPageURL} target="_blank" rel="noreferrer">
          <div>Visit Uniswap to buy wZNN.</div>
        </a>
      </div>,
      {
        position: "bottom-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
        toastId: "limitReached",
      }
    );
  };

  const enableAddingLiquidity = () => {
    setIsNextDisabled(false);
    setNextButtonLabel(defaultNextButtonLabel);
  };

  const startLiquidityFlow = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("ercToken", ercToken);
        console.log("zenonToken", zenonToken);

        const currentPair = globalConstants.liquidityTokenPairs.find(
          (pair: any) =>
            pair.internalToken.address?.toLowerCase() == zenonToken.address?.toLowerCase() &&
            (ercToken.symbol == "ETH" || pair.externalToken.address?.toLowerCase() == ercToken.address?.toLowerCase())
        );

        const routerAddress = currentPair.routerContract;
        console.log("routerAddress", routerAddress);
        const provider = await externalNetworkClient.getProvider();

        console.log("zenonAmount", zenonAmount);
        console.log("ercAmount", ercAmount);

        let addLiquidityResponse;

        if (ercToken.symbol == "ETH" && ercToken.address == "") {
          // Step 1. Approve spending of ercToken == token1 == zenonToken
          const token0 = new ethers.Contract(zenonToken.address, globalConstants.abiToken, provider);
          console.log("token0", token0);

          const zenonTokenCopy = {
            ...zenonToken,
            decimals: await token0.decimals(),
          };

          const ercTokenCopy = {
            ...ercToken,
          };

          const parsedZenonAmount = ethers.utils.parseUnits(
            zenonAmount,
            ethers.BigNumber.from(zenonTokenCopy.decimals)
          );
          const parsedErcAmount = ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals));

          console.log("parsedZenonAmount", parsedZenonAmount.toString());
          console.log("parsedErcAmount", parsedErcAmount.toString());

          const allowedAmountToken0 = await token0.allowance(ercAddress, routerAddress);

          console.log(
            "allowedAmountToken0",
            allowedAmountToken0,
            ethers.utils.formatUnits(allowedAmountToken0, ethers.BigNumber.from(zenonTokenCopy.decimals))
          );

          if (
            ethers.BigNumber.from(allowedAmountToken0).lt(
              ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonTokenCopy.decimals))
            )
          ) {
            console.log("Approving with", routerAddress, parsedZenonAmount);

            handleSpinner(
              <>
                <div className="text-bold text-center mb-5 mt-4">Approving {zenonToken.symbol}</div>
              </>,
              "extension-approval-spinner-root"
            );

            const approveParameters = [routerAddress, parsedZenonAmount];
            console.log("approveParameters", approveParameters);

            const approve1Response = await externalNetworkClient.callContract(
              zenonToken.address,
              globalConstants.abiToken,
              "approve",
              approveParameters
            );

            console.log("approve1Response", approve1Response);

            console.log("Approved", zenonTokenCopy.address, parsedZenonAmount, ercAddress);
          }

          handleSpinner(
            <>
              <div className="text-bold text-center mb-5 mt-4">Adding liquidity</div>
            </>,
            "extension-approval-spinner-root"
          );

          const metamaskAddress = (await externalNetworkClient.getWalletInfo(provider))?.address;

          const lastBlockTimestamp = (await provider.getBlock("latest")).timestamp;
          console.log("lastBlockTimestamp", lastBlockTimestamp);

          handleSpinner(
            <>
              <div className="text-bold text-center mb-5 mt-4">Waiting confirmation for liquidity adding</div>
            </>,
            "extension-approval-spinner-root"
          );

          console.log(
            `token,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            to,
            deadline`,
            zenonTokenCopy.address,
            parsedZenonAmount.toString(),
            applySlippage(parsedZenonAmount, maxSlippagePercentage).toString(),
            applySlippage(parsedErcAmount, maxSlippagePercentage).toString(),
            metamaskAddress,
            lastBlockTimestamp + 90
          );

          const addLiquidityETHParameters = [
            zenonTokenCopy.address,
            parsedZenonAmount,
            applySlippage(parsedZenonAmount, maxSlippagePercentage),
            applySlippage(parsedErcAmount, maxSlippagePercentage),
            metamaskAddress,
            lastBlockTimestamp + 90,
          ];
          console.log("addLiquidityETHParameters", addLiquidityETHParameters);

          const defaultGasLimit = ethers.BigNumber.from(1);

          const estimatedGas = await externalNetworkClient.estimateGas(
            routerAddress,
            globalConstants.routerAbi,
            "addLiquidityETH",
            addLiquidityETHParameters,
            parsedErcAmount,
            defaultGasLimit
          );
          console.log("estimatedGas", estimatedGas);

          const gasLimit = estimatedGas.mul(2);
          console.log("gasLimit", gasLimit);

          addLiquidityResponse = await externalNetworkClient.callContract(
            routerAddress,
            globalConstants.routerAbi,
            "addLiquidityETH",
            addLiquidityETHParameters,
            parsedErcAmount,
            estimatedGas
          );
        } else {
          // Step 1. Approve spending of internalToken == token0 == zenonToken
          const token0 = new ethers.Contract(zenonToken.address, globalConstants.abiToken, provider);

          const zenonTokenCopy = {
            ...zenonToken,
            decimals: await token0.decimals(),
          };

          console.log("zenonTokenCopy", zenonTokenCopy);

          const parsedZenonAmount = ethers.utils.parseUnits(
            zenonAmount,
            ethers.BigNumber.from(zenonTokenCopy.decimals)
          );

          const allowedAmountToken0 = await token0.allowance(ercAddress, routerAddress);
          console.log(
            "allowedAmountToken0",
            allowedAmountToken0,
            ethers.utils.formatUnits(allowedAmountToken0, ethers.BigNumber.from(zenonTokenCopy.decimals))
          );
          if (
            ethers.BigNumber.from(allowedAmountToken0).lt(
              ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonTokenCopy.decimals))
            )
          ) {
            console.log(
              "Approving with",
              routerAddress,
              ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonTokenCopy.decimals))
            );

            handleSpinner(
              <>
                <div className="text-bold text-center mb-5 mt-4">Approving {zenonToken.symbol}</div>
              </>,
              "extension-approval-spinner-root"
            );

            const approve0Parameters = [
              routerAddress,
              ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonTokenCopy.decimals)),
            ];
            console.log("approve0Parameters", approve0Parameters);

            const approve0Response = await externalNetworkClient.callContract(
              zenonToken.address,
              globalConstants.abiToken,
              "approve",
              approve0Parameters
            );

            console.log("approve0Response", approve0Response);

            console.log(
              "Approved",
              zenonTokenCopy.address,
              ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonTokenCopy.decimals)),
              ercAddress
            );
          }
          // Step 2: Approve externalToken == token1 == ercToken
          handleSpinner(
            <>
              <div className="text-bold text-center mb-5 mt-4">Approving {ercToken.symbol}</div>
            </>,
            "extension-approval-spinner-root"
          );

          const token1 = new ethers.Contract(ercToken.address, globalConstants.abiToken, provider);
          console.log("token1", token1);

          const ercTokenCopy = {
            ...ercToken,
            decimals: await token1.decimals(),
          };
          console.log("ercTokenCopy", ercTokenCopy);

          const parsedErcAmount = ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals));

          const allowedAmountToken1 = await token1.allowance(ercAddress, routerAddress);
          console.log(
            "allowedAmountToken1",
            allowedAmountToken1,
            ethers.utils.formatUnits(allowedAmountToken1, ethers.BigNumber.from(ercTokenCopy.decimals))
          );
          if (
            ethers.BigNumber.from(allowedAmountToken1).lt(
              ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
            )
          ) {
            console.log(
              "Approving with",
              routerAddress,
              ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
            );

            const approve1Parameters = [
              routerAddress,
              ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals)),
            ];
            console.log("approve1Parameters", approve1Parameters);

            const approve1Response = await externalNetworkClient.callContract(
              ercToken.address,
              globalConstants.abiToken,
              "approve",
              approve1Parameters
            );

            console.log("approve1Response", approve1Response);
          }

          console.log(
            "Approved",
            ercTokenCopy.address,
            ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals)),
            ercAddress
          );
          // Step 3 make request
          handleSpinner(
            <>
              <div className="text-bold text-center mb-5 mt-4">Adding liquidity</div>
            </>,
            "extension-approval-spinner-root"
          );

          const metamaskAddress = (await externalNetworkClient.getWalletInfo(provider))?.address;

          const lastBlockTimestamp = (await provider.getBlock("latest")).timestamp;
          console.log("lastBlockTimestamp", lastBlockTimestamp);

          handleSpinner(
            <>
              <div className="text-bold text-center mb-5 mt-4">Waiting confirmation for liquidity adding</div>
            </>,
            "extension-approval-spinner-root"
          );

          const tokenAParams = {
            tokenAddress: "",
            amountDesired: ethers.BigNumber.from("0"),
            amountMin: ethers.BigNumber.from("0"),
          };

          const tokenBParams = {
            tokenAddress: "",
            amountDesired: ethers.BigNumber.from("0"),
            amountMin: ethers.BigNumber.from("0"),
          };

          // For now, it is hardcoded: tokenA is always internalToken (wZNN)
          // tokenB is always ercToken (weth)
          tokenAParams.tokenAddress = zenonTokenCopy.address;
          tokenBParams.tokenAddress = ercTokenCopy.address;

          tokenAParams.amountDesired = parsedZenonAmount;
          tokenBParams.amountDesired = parsedErcAmount;

          tokenAParams.amountMin = applySlippage(parsedZenonAmount, maxSlippagePercentage);
          tokenBParams.amountMin = applySlippage(parsedErcAmount, maxSlippagePercentage);

          // If we ever need to keep track and token0 should be tokenA
          // and token1 should be tokenB below we have the logic below
          //
          // if (currentPair.internalToken.uniswapTokenIndex == 0 && currentPair.externalToken.uniswapTokenIndex == 1) {
          //   // If token0 == internal => zenon = tokenA
          //   console.log("token0 == internal => zenon = tokenA");
          //   tokenAParams.tokenAddress = zenonTokenCopy.address;
          //   tokenBParams.tokenAddress = ercTokenCopy.address;

          //   tokenAParams.amountDesired = parsedZenonAmount;
          //   tokenBParams.amountDesired = parsedErcAmount;

          //   tokenAParams.amountMin = applySlippage(parsedZenonAmount, maxSlippagePercentage);
          //   tokenBParams.amountMin = applySlippage(parsedErcAmount, maxSlippagePercentage);
          // } else if (
          //   currentPair.internalToken.uniswapTokenIndex == 1 &&
          //   currentPair.externalToken.uniswapTokenIndex == 0
          // ) {
          //   // If token1 == internal => erc = tokenA
          //   console.log("token1 == internal => erc = tokenA");
          //   tokenAParams.tokenAddress = ercTokenCopy.address;
          //   tokenBParams.tokenAddress = zenonTokenCopy.address;

          //   tokenAParams.amountDesired = parsedErcAmount;
          //   tokenBParams.amountDesired = parsedZenonAmount;

          //   tokenAParams.amountMin = applySlippage(parsedErcAmount, maxSlippagePercentage);
          //   tokenBParams.amountMin = applySlippage(parsedZenonAmount, maxSlippagePercentage);
          // } else {
          //   throw new Error("Token indexes are different from uniswap");
          // }

          console.log("tokenAParams", tokenAParams);
          console.log("tokenBParams", tokenBParams);

          // console.log(
          //   `tokenA,
          //   tokenB,
          //   amountADesired,
          //   amountBDesired,
          //   amountAMin,
          //   amountBMin,
          //   to,
          //   deadline`,
          //   zenonTokenCopy.address,
          //   ercTokenCopy.address,
          //   parsedZenonAmount.toString(),
          //   parsedErcAmount.toString(),
          //   applySlippage(parsedZenonAmount, maxSlippagePercentage).toString(),
          //   applySlippage(parsedErcAmount, maxSlippagePercentage).toString(),
          //   metamaskAddress,
          //   lastBlockTimestamp + 90
          // );

          // addLiquidityResponse = await signedContract.addLiquidity(
          //   zenonTokenCopy.address,
          //   ercTokenCopy.address,
          //   parsedZenonAmount,
          //   parsedErcAmount,
          //   applySlippage(parsedZenonAmount, maxSlippagePercentage),
          //   applySlippage(parsedErcAmount, maxSlippagePercentage),
          //   metamaskAddress,
          //   lastBlockTimestamp + 90
          // );

          console.log(
            `tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to,
            deadline`,
            tokenAParams.tokenAddress,
            tokenBParams.tokenAddress,
            tokenAParams.amountDesired.toString(),
            tokenBParams.amountDesired.toString(),
            tokenAParams.amountMin.toString(),
            tokenBParams.amountMin.toString(),
            metamaskAddress,
            lastBlockTimestamp + 90
          );

          const addLiquidityParameters = [
            tokenAParams.tokenAddress,
            tokenBParams.tokenAddress,
            tokenAParams.amountDesired,
            tokenBParams.amountDesired,
            tokenAParams.amountMin,
            tokenBParams.amountMin,
            metamaskAddress,
            lastBlockTimestamp + 90,
          ];
          console.log("addLiquidityParameters", addLiquidityParameters);

          addLiquidityResponse = await externalNetworkClient.callContract(
            routerAddress,
            globalConstants.routerAbi,
            "addLiquidity",
            addLiquidityParameters
          );
        }

        console.log("addLiquidityResponse", addLiquidityResponse);

        toast(
          <div>
            <div>Successfully added liquidity!</div>
            <a
              className="no-decoration"
              href={externalExplorerByChainId[ercToken?.network?.chainId] + "" + (addLiquidityResponse?.hash || "")}
              target="_blank"
              rel="noreferrer">
              <div>See explorer</div>
            </a>
          </div>,
          {
            position: "bottom-center",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "success",
            theme: "dark",
          }
        );

        resolve(addLiquidityResponse?.hash || "");
      } catch (err: any) {
        console.error(err);

        let readableError = JSONbig.stringify(err);

        if (readableError.includes(`Wrong signature`)) readableError = "Wrong transaction signature.";
        else if (
          readableError.includes(`user rejected transaction`) ||
          readableError.includes("User denied transaction")
        )
          readableError = "You rejected the Metamask transaction.";
        else if (readableError.includes(`INSUFFICIENT_AMOUNT`)) readableError = "Insufficient amount";
        else if (readableError.includes(`Cannot set properties of undefined`))
          readableError = "You closed Metamask Extension too soon.";
        else if (readableError.includes(`reason string`))
          readableError = readableError?.split(`reason string '`)?.pop()?.split(`'`)[0] || "";
        else if (readableError.includes(`Reason:`))
          readableError = readableError?.split(`"Reason:`)?.pop()?.split(`"`)[0] || "";
        else if (readableError.includes(`MetaMask Tx Signature: `))
          readableError = readableError?.split(`"MetaMask Tx Signature: `)?.pop()?.split(`"`)[0] || "";
        else if (err?.message) {
          readableError = err?.message;
        } else readableError = "Error redeeming - check console";

        toast(readableError + "", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "error",
          theme: "dark",
        });
        return reject(err);
      }
    });
  };

  const onFormSubmit = async () => {
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting approval from wallet</div>
      </>,
      "extension-approval-spinner-root"
    );
    setIsNextDisabled(true);
    try {
      await addLiquidityToPool();
      showSpinner(false);
      setIsNextDisabled(false);
      setNextButtonLabel("Waiting for approval from wallet...");
      console.log("onFormSubmit");
      onStepSubmit();
    } catch (err: any) {
      setIsNextDisabled(false);
      setNextButtonLabel(defaultNextButtonLabel);
      showSpinner(false);
      console.error(err);
      toast((err?.message || err) + "", {
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

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit(() => onFormSubmit())}>
        <div className={`flow-order reverse-direction`}>
          <div className="fromToken w-100 mt-5" key="fromToken">
            <div className="d-flex justify-content-between responsive-rows">
              <div className="flex-1 min-width-100">
                <TokenDropdown
                  onTokenSelect={(token) => onZenonDropdownChange(token)}
                  isDisabled={false}
                  preselectedSearch={preselectedInternalTokenSearch}
                  availableTokens={internalFilteredTokens}
                  availableNetworks={internalFilteredNetworks}
                  token={zenonToken}
                  label={"Select Token / Network"}
                  placeholder={"Placeholder"}
                  error={errors.zenonToken}
                  {...register("zenonToken", { required: true })}
                />
                <div className={`input-error ${errors.zenonToken?.type === "required" ? "" : "invisible"}`}>
                  Token is required
                </div>
              </div>

              <div className="custom-control flex-1 min-width-100">
                <div className={`input-with-button w-100`}>
                  <input
                    {...register("zenonAmountField", {
                      required: true,
                      max: {
                        value: zenonBalance,
                        message: "Maximum of " + zenonBalance,
                      },
                    })}
                    className={`w-100 custom-label pr-3 ${errors.zenonAmountField ? "custom-label-error" : ""}`}
                    placeholder={"0.0"}
                    value={zenonAmount}
                    onChange={(e) => {
                      updateZenonAmount(e.target.value, true);
                    }}
                    type="number"></input>
                  <div className="input-label">{zenonToken?.symbol + " amount"}</div>
                  <div
                    className={(zenonToken?.symbol === "ZNN" ? "primary" : "accent") + " input-chip-button"}
                    onClick={() => {
                      updateZenonAmount(zenonBalance + "", true);
                    }}>
                    <span>{"MAX ~ " + parseFloat(zenonBalance + "").toFixed(0)}</span>
                  </div>
                </div>

                <div className={`input-error ${errors.zenonAmountField ? "" : "invisible"}`}>
                  {errors.zenonAmountField?.message + "" || "Amount is required"}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center height-30px">
              {externalNetworkClient.providerType == externalNetworkProviderTypes.metamask ? (
                <div className="text-button" onClick={() => addTokenToMetamask(ercToken)}>
                  <span className="mr-1 text-nowrap">Add token to metamask</span>
                  <img
                    alt="text-button-icon"
                    className="text-button-icon"
                    src={require("./../../../assets/logos/metamask.png")}></img>
                </div>
              ) : (
                <div></div>
              )}

              <div className="d-flex text-right">
                {"Balance: "}
                {isZenonBalanceLoading ? (
                  <div className="contextual-spinner-container mr-1 ml-1">
                    <img alt="" src={spinnerSvg} className="spinner" />
                  </div>
                ) : (
                  zenonBalance
                )}
                {" " + zenonToken?.symbol}
              </div>
            </div>
          </div>

          <div className="toToken w-100 mt-5" key="toToken">
            <div className="d-flex justify-content-between responsive-rows">
              <div className="flex-1 min-width-100">
                <TokenDropdown
                  onTokenSelect={(token) => onErcDropdownChange(token)}
                  isDisabled={false}
                  preselectedSearch={preselectedExternalTokenSearch}
                  availableTokens={externalFilteredTokens}
                  availableNetworks={externalFilteredNetworks}
                  token={ercToken}
                  label={"Select Token / Network"}
                  placeholder={"Placeholder"}
                  error={errors.ercToken}
                  {...register("ercToken", { required: true })}
                />
                <div className={`input-error ${errors.ercToken?.type === "required" ? "" : "invisible"}`}>
                  Token is required
                </div>
              </div>

              <div className="custom-control flex-1 min-width-100">
                <div className={`input-with-button w-100`}>
                  <input
                    {...register("ercAmountField", {
                      required: true,
                      max: {
                        value: ercBalance,
                        message: "Maximum of " + ercBalance,
                      },
                    })}
                    className={`w-100 custom-label pr-3 ${errors.ercAmountField ? "custom-label-error" : ""}`}
                    placeholder={"0.0"}
                    value={ercAmount}
                    onChange={(e) => {
                      updateErcAmount(e.target.value, true);
                    }}
                    type="number"></input>
                  <div className="input-label">{ercToken?.symbol + " amount"}</div>
                  <div
                    className={(ercToken?.symbol === "ZNN" ? "primary" : "accent") + " input-chip-button"}
                    onClick={() => {
                      updateErcAmount(ercBalance + "", true);
                    }}>
                    <span>{"MAX ~ " + parseFloat(ercBalance + "").toFixed(0)}</span>
                  </div>
                </div>

                <div className={`input-error ${errors.ercAmountField ? "" : "invisible"}`}>
                  {errors.ercAmountField?.message + "" || "Amount is required"}
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center height-30px">
              {externalNetworkClient.providerType == externalNetworkProviderTypes.metamask ? (
                <div className="text-button" onClick={() => addTokenToMetamask(ercToken)}>
                  <span className="mr-1 text-nowrap">Add token to metamask</span>
                  <img
                    alt="text-button-icon"
                    className="text-button-icon"
                    src={require("./../../../assets/logos/metamask.png")}></img>
                </div>
              ) : (
                <div></div>
              )}

              <div className="d-flex text-right">
                {"Balance: "}
                {isErcBalanceLoading ? (
                  <div className="contextual-spinner-container mr-1 ml-1">
                    <img alt="" src={spinnerSvg} className="spinner" />
                  </div>
                ) : (
                  ercBalance
                )}
                {" " + ercToken?.symbol}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-between responsive-rows align-items-center">
          <div className="flex-1 min-width-100">
            <div className={`input-with-button w-100`}>
              <input
                {...register("maxSlippagePercentageField", {
                  required: true,
                  min: {
                    value: 0,
                    message: "Minimum of " + 0,
                  },
                  max: {
                    value: 100,
                    message: "Maximum of " + 100,
                  },
                })}
                className={`w-100 custom-label pr-3 ${errors.maxSlippagePercentageField ? "custom-label-error" : ""}`}
                value={maxSlippagePercentage}
                onChange={(e) => {
                  setMaxSlippagePercentage(parseFloat(e.target.value));
                }}
                type="number"></input>
              <div className="input-label">Slippage percentage</div>
              <div
                className={"primary input-chip-button"}
                onClick={() => {
                  setMaxSlippagePercentage(1);
                }}>
                <span>{"Optimal: 1%"}</span>
              </div>
            </div>
            <div className={`input-error ${errors.maxSlippagePercentageField ? "" : "invisible"}`}>
              {errors.maxSlippagePercentageField?.message + "" || "Slippage amount is required"}
            </div>
          </div>
          <div className="flex-1 min-width-100">
            <div className="d-flex justify-content-start">
              <img alt="fees-info" className="switch-arrow mr-1" src={infoIcon}></img>
              <span className="">{`Slippage is the difference between the expected price of the order and the price when the order actually executes.`}</span>
            </div>
          </div>
        </div>
        <div className="d-flex flex-wrap justify-content-start mt-2">
          <img alt="fees-info" className="switch-arrow mr-1" src={infoIcon}></img>
          <span className="text-nowrap">{`1 ${ercToken.symbol} = ${tokenParity} ${zenonToken.symbol}`}</span>
        </div>
        <div className="d-flex flex-wrap justify-content-start mt-1">
          <img alt="fees-info" className="switch-arrow mr-1" src={infoIcon}></img>
          <span className="text-nowrap">
            {"More info on "}
            <b>
              <a className="uniswap-pool-link" href={globalConstants.uniswapPoolLink} target="_blank" rel="noreferrer">
                {"Uniswap pool page"}
              </a>
            </b>
          </span>
        </div>
        <div className={`button primary w-100 mt-4 ${Object.keys(errors).length || isNextDisabled ? "disabled" : ""}`}>
          {nextButtonLabel}
          <input className="ghost-over cursor-pointer" type="submit" name="submitButton"></input>
        </div>
      </form>
    </div>
  );
};

export default AddLiquidityStep;
