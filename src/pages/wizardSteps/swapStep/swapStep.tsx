import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { FC, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Primitives, Zenon } from "znn-ts-sdk";
import arrowDownIcon from "../../../assets/arrow-down-white.svg";
import infoIconBlue from "../../../assets/info-icon-blue.svg";
import infoIconRed from "../../../assets/info-icon-red.svg";
import infoIcon from "../../../assets/info-icon.svg";
import warningIcon from "../../../assets/warning-icon.svg";
import TokenDropdown from "../../../components/tokenDropdown/tokenDropdown";
import { SimpleToken } from "../../../models/SimpleToken";
import { UnwrapRequestItem, unwrapRequestStatus } from "../../../models/unwrapRequestItem";
import { WrapRequestItem, wrapRequestStatus } from "../../../models/wrapRequestItem";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import useZenon from "../../../services/hooks/zenon-provider/useZenon";
import { storeGlobalConstants } from "../../../services/redux/globalConstantsSlice";
import { storeActiveUnwrapRequest, storeActiveWrapRequest } from "../../../services/redux/requestsSlice";
import { storeErcInfo, storeZenonInfo } from "../../../services/redux/walletSlice";
import { flowTypes, swapFlowSteps } from "../../../services/redux/wizardStatusSlice";
import {
  addBigNumberStrings,
  divideBigNumberStrings,
  findInObject,
  getExternalTokensDetails,
  getInternalTokensDetails,
  hasLowPlasma,
  multiplyBigNumberStrings,
  subtractBigNumberStrings,
  updateTokenPairsWithNewExternalTokens,
  updateTokenPairsWithNewInternalTokens,
  validateMetamaskNetwork,
} from "../../../utils/utils";
import "./swapStep.scss";

/**
 * * GTM SERVICE
 */
import {  useGTMDispatch } from '@elgorditosalsero/react-gtm-hook'


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
  availableSoon?: boolean;
  isCommonToken?: boolean;
  network: simpleNetworkType;
};

export type simpleNetworkType = {
  name: string;
  chainId: number;
  contractAddress?: string;
  networkClass?: number;
  isAvailable: boolean;
  availableSoon?: boolean;
  icon?: any;
  color?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const SwapStep: FC<{ onStepSubmit: () => void }> = ({ onStepSubmit }) => {
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
  const [isNextDisabled, setIsNextDisabled] = useState(false);
  const referralInfo = useSelector((state: any) => state.referral);

  const [minZenonAmount, setMinZenonAmount] = useState("1");
  const [zenonAmount, setZenonAmount] = useState("");
  const [zenonBalance, setZenonBalance] = useState("");
  const [plasmaBalance, setPlasmaBalance] = useState(0);
  const [zenonAddress, setZenonAddress] = useState("");
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

  const [minErcAmount, setMinErcAmount] = useState("");
  const [ercAmount, setErcAmount] = useState("");
  const [ercBalance, setErcBalance] = useState("");
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

  const [isUnwrapDirection, setIsUnwrapDirection] = useState(false);
  const globalConstants = useSelector((state: any) => state.globalConstants);

  const [internalFilteredNetworks, setInternalFilteredNetworks] = useState(globalConstants.internalAvailableNetworks);
  const [externalFilteredNetworks, setExternalFilteredNetworks] = useState(globalConstants.externalAvailableNetworks);
  const [internalFilteredTokens, setInternalFilteredTokens] = useState(globalConstants.internalAvailableTokens);
  const [externalFilteredTokens, setExternalFilteredTokens] = useState(globalConstants.externalAvailableTokens);

  const [preselectedInternalTokenSearch, setPreselectedInternalTokenSearch] = useState("");
  const [preselectedExternalTokenSearch, setPreselectedExternalTokenSearch] = useState("");

  const [wrapFeePercentage, setWrapFeePercentage] = useState(0);
  const [unwrapFeePercentage, setUnwrapFeePercentage] = useState(0);

  const { zenonClient } = useZenon();
  const referralCode = useSelector((state: any) => state.referral);

  const wizardStatus = useSelector((state: any) => state.wizardStatus);

  useEffect(() => {
    const runAsyncTasks = async () => {
      console.log("swapStep globalConstants", globalConstants);
      let metamaskCurrentChainId: number;
      let defaultExternalToken: any;
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        metamaskCurrentChainId = (await provider.getNetwork())?.chainId;
        await validateMetamaskNetwork(provider, globalConstants.externalAvailableNetworks, metamaskCurrentChainId);
        console.log("metamaskCurrentChainId", metamaskCurrentChainId);
        console.log("globalConstants.externalAvailableTokens", globalConstants.externalAvailableTokens);
        defaultExternalToken = globalConstants.externalAvailableTokens.find(
          (tok: any) => tok.isAvailable && metamaskCurrentChainId === tok.network.chainId
        );
      } catch (err) {
        console.error(err);
        defaultExternalToken = globalConstants.externalAvailableTokens.find((tok: any) => tok.isAvailable);
      }

      const ercTok = {
        ...(globalConstants.externalAvailableTokens.find(
          (tok: any) => tok.address == ercToken.address && tok.network.chainId === metamaskCurrentChainId
        ) || defaultExternalToken),
        balance: JSONbig.parse(serializedWalletInfo["ercInfo"]).balance,
      };
      console.log("init ercToken", ercTok);
      setValue("ercToken", ercTok, { shouldValidate: true });
      setErcToken(ercTok);

      console.log(
        "getPairOfToken(defaultExternalToken.address, defaultExternalToken?.network?.chainId)",
        getPairOfToken(defaultExternalToken.address, defaultExternalToken.chainIdsOfPairedTokens[0])
      );
      console.log("defaultExternalToken", defaultExternalToken);
      console.log("JSONbig.parse(serializedWalletInfo['zenonInfo'])", JSONbig.parse(serializedWalletInfo["zenonInfo"]));

      const internalToken = findInObject(
        JSONbig.parse(serializedWalletInfo["zenonInfo"])?.balanceInfoMap,
        (tok: any) =>
          tok.address ===
          getPairOfToken(defaultExternalToken.address, defaultExternalToken.chainIdsOfPairedTokens[0]).address
      );
      const znnTok = {
        ...internalToken,
        balance: Number(
          ethers.utils.formatUnits(
            ethers.BigNumber.from((internalToken?.balance || 0) + ""),
            ethers.BigNumber.from(internalToken?.decimals || 8)
          )
        ),
      };
      console.log("init zenonToken", znnTok);
      setValue("zenonToken", znnTok, { shouldValidate: true });
      setZenonToken(znnTok);
    };

    runAsyncTasks();
    const changeEventHandlers = detectExtensionsChanges();
    return () => {
      removeWeb3ChangeListeners(changeEventHandlers);
    };
  }, []);

  useEffect(() => {
    if (wizardStatus.metaFlowType == flowTypes.LiquidityStaking && wizardStatus.currentFlowStep == swapFlowSteps.Swap) {
      toast("Setting uniswap liquidity tokens...", {
        position: "bottom-center",
        autoClose: 2900,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "info",
        theme: "dark",
        toastId: "settingTokens",
      });

      setTimeout(async () => {
        console.log("globalConstants.internalAvailableTokens", globalConstants.internalAvailableTokens);
        const defaultInternalUniswapToken = globalConstants.internalAvailableTokens.find(
          (tok: SimpleToken) =>
            tok.isAvailable &&
            tok.address !== globalConstants.znnTokenInfo.address &&
            tok.address !== globalConstants.qsrTokenInfo.address
        );
        console.log("defaultInternalUniswapToken", defaultInternalUniswapToken);
        if (defaultInternalUniswapToken?.address) {
          await onZenonDropdownChange(defaultInternalUniswapToken);

          toast("Setting direction to unwrap...", {
            position: "bottom-center",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
            toastId: "settingToUnwrap",
          });

          switchDirection("unwrap");
        }
      }, 3000);
    }
  }, [wizardStatus]);

  useEffect(() => {
    console.log("useEffect, zenonToken", zenonToken);
    if (zenonToken.address) {
      const doAsyncUpdates = async () => {
        updateZenonInfoToFrontend(await getZenonWalletInfo(false));
        await updatePair();
      };
      console.log("zenonToken, doAsyncUpdates");
      doAsyncUpdates();
    }
  }, [zenonToken, serializedWalletInfo]);

  useEffect(() => {
    console.log("useEffect, ercToken", ercToken);
    if (ercToken.address) {
      const doAsyncUpdates = async () => {
        updateMetamaskInfoToFrontend(await getMetamaskWalletInfo(false));
        await updatePair();
      };
      console.log("ercToken, doAsyncUpdates");
      doAsyncUpdates();
    }
  }, [ercToken]);

  useEffect(() => {
    if (wrapFeePercentage != 0 || wrapFeePercentage !== 0) {
      if (isUnwrapDirection) {
        if (parseFloat(ercAmount) > 0) {
          updateErcAmount(ercAmount, true, isUnwrapDirection);
        }
      } else {
        if (parseFloat(zenonAmount) > 0) {
          updateZenonAmount(zenonAmount, true, isUnwrapDirection);
        }
      }
    }
  }, [wrapFeePercentage, unwrapFeePercentage]);

  const detectExtensionsChanges = () => {
    const accountChangedHandler = async (accounts: any) => {
      console.log("accountChangedHandler", accounts);
      updateMetamaskInfoToFrontend(await getMetamaskWalletInfo(false));
    };
    window?.ethereum?.on("accountsChanged", accountChangedHandler);

    const chainChangedHandler = async (chainId: any) => {
      console.log("chainChangedHandler", ethers.BigNumber.from(chainId).toNumber());
      updateMetamaskInfoToFrontend(await getMetamaskWalletInfo(false));
    };
    window?.ethereum?.on("chainChanged", chainChangedHandler);

    return {
      accountsChanged: accountChangedHandler,
      chainChanged: chainChangedHandler,
    };
  };

  const removeWeb3ChangeListeners = (changeEventHandlers: any) => {
    console.log("Removing web3 change listeners", changeEventHandlers);
    window?.ethereum?.removeListener("accountsChanged", changeEventHandlers.accountsChanged);
    window?.ethereum?.removeListener("chainChanged", changeEventHandlers.chainChanged);
  };

  const getMetamaskWalletInfo = async (showToastNotification = true) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await validateMetamaskNetwork(provider, globalConstants.externalAvailableNetworks);
      const accounts = await provider.send("eth_requestAccounts", []);
      console.log("accounts", JSONbig.stringify(accounts));
      console.log("ercToken", JSONbig.stringify(ercToken));

      const externalTokens = await getExternalTokensDetails(globalConstants.externalAvailableTokens, provider);
      const updatedConstants = {
        ...globalConstants,
        externalAvailableTokens: externalTokens,
        tokenPairs: updateTokenPairsWithNewExternalTokens(globalConstants.tokenPairs, externalTokens),
      };
      dispatch(storeGlobalConstants(updatedConstants));

      console.log("updatedConstants after metamask data", updatedConstants);
      console.log("updatedConstants", updatedConstants);

      const metamaskCurrentChainId = (await provider.getNetwork())?.chainId;
      const currentToken = ercToken.address
        ? ercToken
        : updatedConstants.externalAvailableTokens.find(
          (tok: any) => tok.isAvailable == true && metamaskCurrentChainId === tok.network.chainId
        );

      console.log("currentToken", JSONbig.stringify(currentToken));

      const contract = new ethers.Contract(currentToken.address, updatedConstants.wznnAbi, provider);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const signedContract = contract.connect(signer);

      console.log("signedContract", signedContract);

      const rawErcBalance = await signedContract.balanceOf(accounts[0]);

      console.log("rawErcBalance", rawErcBalance);
      console.log("currentToken.decimals", currentToken.decimals);

      const formattedErcBalance = ethers.utils.formatUnits(rawErcBalance, currentToken.decimals);

      console.log("formattedErcBalance", formattedErcBalance);

      const ercInfo = { address: accounts[0], balance: formattedErcBalance, rawBalance: rawErcBalance };
      dispatch(storeErcInfo(JSONbig.stringify(ercInfo)));

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

      return ercInfo;
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
    }
  };

  const updateMetamaskInfoToFrontend = (ercInfo: any) => {
    console.log("JSON.stringify(ercInfo)", JSON.stringify(ercInfo));
    if (ercInfo?.address) {
      setValue("ercAddress", ercInfo?.address, { shouldValidate: true });
      setErcAddress(ercInfo?.address);
      setErcBalance(ercInfo.balance);
    }
  };

  const getZenonWalletInfo = async (showToastNotification = true) => {
    try {
      console.log(`JSONbig.parse(serializedWalletInfo["zenonInfo"])`, JSONbig.parse(serializedWalletInfo["zenonInfo"]));

      const znnAddressObject = Primitives.Address.parse(JSONbig.parse(serializedWalletInfo["zenonInfo"])?.address);

      console.log("znnAddress", znnAddressObject);

      const zenon = Zenon.getSingleton();
      const getAccountInfoByAddress = await zenon.ledger.getAccountInfoByAddress(znnAddressObject);

      console.log("getAccountInfoByAddress", getAccountInfoByAddress);
      console.log("JSONbig.stringify(getAccountInfoByAddress)", JSONbig.stringify(getAccountInfoByAddress));

      const plasma = await zenon.embedded.plasma.get(znnAddressObject);

      console.log("plasma", plasma);

      getAccountInfoByAddress.plasma = plasma;

      const updatedInternalTokens = await getInternalTokensDetails(globalConstants.internalAvailableTokens, zenon);
      const updatedTokenPairs = updateTokenPairsWithNewInternalTokens(
        globalConstants.tokenPairs,
        updatedInternalTokens
      );

      console.log("Z-updatedInternalTokens", updatedInternalTokens);
      console.log("Z-updatedTokenPairs", updatedTokenPairs);

      const updatedConstants = {
        ...globalConstants,
        internalAvailableTokens: updatedInternalTokens,
        tokenPairs: updatedTokenPairs,
      };

      dispatch(storeGlobalConstants(updatedConstants));

      console.log("updatedConstants after zenon data", updatedConstants);

      getAccountInfoByAddress.balanceInfoMap = updatedConstants.internalAvailableTokens.map((tok: simpleTokenType) => {
        if (getAccountInfoByAddress.balanceInfoMap[tok.address]) {
          return {
            ...tok,
            balance: getAccountInfoByAddress.balanceInfoMap[tok.address].balance.toString(),
            symbol: getAccountInfoByAddress.balanceInfoMap[tok.address].token.symbol,
            decimals: getAccountInfoByAddress.balanceInfoMap[tok.address].token.decimals,
          };
        }
        return tok;
      });

      dispatch(storeZenonInfo(JSONbig.stringify(getAccountInfoByAddress)));

      if (showToastNotification) {
        toast("Zenon account updated", {
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
      return getAccountInfoByAddress;
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
    }
  };

  const updateZenonInfoToFrontend = (zenonInfo: any) => {
    console.log("zenonInfo", zenonInfo);
    if (zenonInfo?.address) {
      setValue("zenonAddress", zenonInfo?.address, { shouldValidate: true });
      setZenonAddress(zenonInfo?.address);
      setPlasmaBalance(zenonInfo?.plasma?.currentPlasma);

      let tokenWithoutBalance =
        findInObject(globalConstants.internalAvailableTokens, (tok: any) => tok.address == zenonToken.address) ||
        globalConstants.internalAvailableTokens[0];

      console.log("tokenWithoutBalance", tokenWithoutBalance);

      const tokenWithUpdatedBalance = findInObject(
        zenonInfo?.balanceInfoMap,
        (tok: any) =>
          tok?.token?.tokenStandard == tokenWithoutBalance.address || tok?.address == tokenWithoutBalance.address
      );

      console.log("tokenWithUpdatedBalance", tokenWithUpdatedBalance);

      tokenWithoutBalance = {
        ...tokenWithoutBalance,
        balance: (tokenWithUpdatedBalance.balance || 0).toString(),
      };
      setZenonBalance(
        ethers.utils.formatUnits(
          ethers.BigNumber.from((tokenWithoutBalance?.balance || 0) + ""),
          ethers.BigNumber.from(tokenWithoutBalance?.decimals || 8)
        )
      );
    }
  };

  const updatePair = async (_isUnwrapDirection: boolean = isUnwrapDirection) => {
    console.log("updatePair", updatePair);
    console.log("ercToken", ercToken);
    console.log("zenonToken", zenonToken);

    if (ercToken.address && zenonToken.address) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentContractAddress = globalConstants.externalAvailableNetworks.find(
        (net: any) => net.chainId == ercToken.network.chainId
      ).contractAddress;

      console.log("currentContractAddress", currentContractAddress);

      const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const c = contract.connect(signer);

      console.log("contract", contract);
      console.log("ercToken.address", ercToken.address);

      const tokensInfo = await c.tokensInfo(ercToken.address);

      console.log("tokensInfo of ercToken", tokensInfo, ercToken);

      if (tokensInfo.allowed === false) {
        console.log("globalConstants.externalAvailableTokens", globalConstants.externalAvailableTokens);

        const updatedConstants = globalConstants.externalAvailableTokens.filter(
          (tok: simpleTokenType) => tok.address !== ercToken.address
        );

        dispatch(storeGlobalConstants(updatedConstants));

        console.log("updatedConstants", updatedConstants);
        console.log("globalConstants.externalAvailableTokens", globalConstants.externalAvailableTokens);

        toast(ercToken.symbol + " token is not available. Please pick another one", {
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

      console.log("tokensInfo", tokensInfo.allowed, tokensInfo.minAmount.toString());
      console.log(
        parseFloat(
          ethers.utils.formatUnits(tokensInfo.minAmount.toString(), ethers.BigNumber.from(ercToken.decimals || 8))
        )
      );

      if (_isUnwrapDirection) {
        console.log(
          "_isUnwrapDirection setMinErcAmount",
          parseFloat(
            ethers.utils.formatUnits(tokensInfo.minAmount.toString(), ethers.BigNumber.from(ercToken.decimals || 8))
          )
        );
        setMinErcAmount(
          ethers.utils.formatUnits(tokensInfo.minAmount.toString(), ethers.BigNumber.from(ercToken.decimals))
        );
        setMinZenonAmount("0");
        setUnwrapFeePercentage(0);
      } else {
        console.log("globalConstants", globalConstants);
        console.log("zenonToken.address", zenonToken.address);
        console.log("ercToken.address", ercToken.address);

        const currentPair = globalConstants.tokenPairs.find(
          (pair: any) =>
            pair.internalToken.address == zenonToken.address && pair.externalToken.address == ercToken.address
        );

        console.log("currentPair", currentPair);

        if (currentPair) {
          setMinZenonAmount(
            ethers.utils.formatUnits(currentPair?.minWrapAmount || 0, ethers.BigNumber.from(zenonToken.decimals))
          );
          setMinErcAmount("0");
          setWrapFeePercentage(currentPair?.wrapFeePercentage || 0);
        } else {
          // This means that the function triggered mid-update. While in process of switching networks and the current pair is not valid.
        }
      }

      console.log("globalConstants.tokenPairs", globalConstants.tokenPairs);
      console.log("zenonToken.address", zenonToken.address);
      console.log("zenonToken", zenonToken);
      console.log("ercToken.address", ercToken.address);
      console.log("ercToken", ercToken);
      console.log("_isUnwrapDirection", _isUnwrapDirection);
    }
  };

  const getPairOfToken = (address: string, destinationChainId = -1) => {
    return (
      globalConstants.tokenPairs.find((pair: any) => pair.internalToken.address == address)?.externalToken ||
      globalConstants.tokenPairs.find(
        (pair: any) =>
          pair.externalToken.address == address && pair?.externalToken?.network?.chainId == destinationChainId
      )?.internalToken
    );
  };

  const clearAllFilters = () => {
    setExternalFilteredTokens(globalConstants.externalAvailableTokens);
    setExternalFilteredNetworks(globalConstants.externalAvailableNetworks);
    setInternalFilteredTokens(globalConstants.internalAvailableTokens);
    setInternalFilteredNetworks(globalConstants.internalAvailableNetworks);
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
        showSpinner(true);
        await window?.ethereum?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.utils.hexValue(pairedToken.network.chainId) }], // chainId must be in hexadecimal format
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

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const networkInfo = await provider.getNetwork();

      console.log("networkInfo", networkInfo);

      if (token.network.chainId !== networkInfo.chainId) {
        await window?.ethereum?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.utils.hexValue(token.network.chainId) }], // chainId must be in hexadecimal format
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
      }

      setValue("ercToken", token, { shouldValidate: true });
      setErcToken(token);

      const pairedToken = getPairOfToken(token.address, token?.network?.chainId);

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
    }
    console.log("onErcDropdownChange", token);
  };

  const updateZenonAmount = (amount: string, alsoUpdatePair = true, _isUnwrapDirection: boolean) => {
    console.log("updateZenonAmount", amount, _isUnwrapDirection);

    setZenonAmount(amount);
    setValue("zenonAmountField", amount, { shouldValidate: true });

    if (alsoUpdatePair) {
      if (_isUnwrapDirection) {
        updateErcAmount(addFee(amount, _isUnwrapDirection) + "", false, _isUnwrapDirection);
      } else {
        updateErcAmount(subtractFee(amount, _isUnwrapDirection) + "", false, _isUnwrapDirection);
      }
    }
  };

  const updateErcAmount = (amount: string, alsoUpdatePair = true, _isUnwrapDirection: boolean) => {
    console.log("updateErcAmount", amount, _isUnwrapDirection);

    setErcAmount(amount);
    setValue("ercAmountField", amount, { shouldValidate: true });

    if (alsoUpdatePair) {
      if (_isUnwrapDirection) {
        updateZenonAmount(subtractFee(amount, _isUnwrapDirection) + "", false, _isUnwrapDirection);
      } else {
        updateZenonAmount(addFee(amount, _isUnwrapDirection) + "", false, _isUnwrapDirection);
      }
    }
  };

  const addFee = (amount: string, _isUnwrapDirection: boolean) => {
    if (_isUnwrapDirection) {
      return addBigNumberStrings([
        multiplyBigNumberStrings([amount.toString(), tokenParity.toString()]),
        multiplyBigNumberStrings([
          amount.toString(),
          tokenParity.toString(),
          divideBigNumberStrings([unwrapFeePercentage.toString(), globalConstants.feeDenominator.toString()]),
        ]),
      ]);
    } else {
      return addBigNumberStrings([
        multiplyBigNumberStrings([amount.toString(), tokenParity.toString()]),
        multiplyBigNumberStrings([
          amount.toString(),
          tokenParity.toString(),
          divideBigNumberStrings([wrapFeePercentage.toString(), globalConstants.feeDenominator.toString()]),
        ]),
      ]);
    }
  };

  const subtractFee = (amount: string, _isUnwrapDirection: boolean) => {
    if (_isUnwrapDirection) {
      return subtractBigNumberStrings([
        multiplyBigNumberStrings([amount.toString(), tokenParity.toString()]),
        multiplyBigNumberStrings([
          amount.toString(),
          tokenParity.toString(),
          divideBigNumberStrings([unwrapFeePercentage.toString(), globalConstants.feeDenominator.toString()]),
        ]),
      ]);
    } else {
      return subtractBigNumberStrings([
        multiplyBigNumberStrings([amount.toString(), tokenParity.toString()]),
        multiplyBigNumberStrings([
          amount.toString(),
          tokenParity.toString(),
          divideBigNumberStrings([wrapFeePercentage.toString(), globalConstants.feeDenominator.toString()]),
        ]),
      ]);
    }
  };

  const switchDirection = async (newDirection?: "wrap" | "unwrap") => {
    clearAllFilters();
    setIsUnwrapDirection((value) => {
      console.log("before switching", value);
      if (newDirection) {
        if (newDirection == "wrap") {
          if (value) {
            // Was unwrap direction, will be wrap direction on next render ZNN => WZNN
            console.log("Was unwrap direction, will be wrap direction on next render", value);
            if (parseFloat(zenonAmount) > 0) {
              updateZenonAmount(parseFloat(ercAmount) + "", true, !value);
              setValue("", "", { shouldValidate: true });
            }
            updatePair(false);
            return false;
          } else {
            // Is already wrap direction
            console.log("Is already wrap direction", value);
            updatePair(false);
            return false;
          }
        } else {
          if (value) {
            // Is already unwrap direction
            console.log("Is already unwrap direction", value);
            updatePair(true);
            return true;
          } else {
            // Was wrap direction, will be unwrap direction on next render WZNN => ZNN
            console.log("Was wrap direction, will be unwrap direction on next render", value);
            if (parseFloat(ercAmount) > 0) {
              updateErcAmount(parseFloat(zenonAmount) + "", true, !value);
              setValue("", "", { shouldValidate: true });
            }
            updatePair(true);
            return true;
          }
        }
      } else {
        if (value) {
          // Was unwrap direction, will be wrap direction on next render ZNN => WZNN
          console.log("Was unwrap direction, will be wrap direction on next render", value);
          if (parseFloat(zenonAmount) > 0) {
            updateZenonAmount(parseFloat(ercAmount) + "", true, !value);
            setValue("", "", { shouldValidate: true });
          }
        } else {
          // Was wrap direction, will be unwrap direction on next render WZNN => ZNN
          console.log("Was wrap direction, will be unwrap direction on next render", value);
          if (parseFloat(ercAmount) > 0) {
            updateErcAmount(parseFloat(zenonAmount) + "", true, !value);
            setValue("", "", { shouldValidate: true });
          }
        }
        updatePair(!value);
        return !value;
      }
    });
  };

  const addTokenToMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const wasAdded = await window?.ethereum?.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20", // Initially only supports ERC20, but eventually more!
            options: {
              address: ercToken.address, // The address that the token is at.
              symbol: ercToken.symbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: ercToken.decimals, // The number of decimals in the token
              image: ercToken.icon, // A string url of the token logo
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

  const znnToWznn = async () => {
    try {
      const hash = await sendWrapRequest();
      console.log("Hash", hash);
      await addCurrentWrapRequestToList(hash);
      onStepSubmit();
    } catch (err) {
      throw err;
    }
  };

  const sendWrapRequest = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const zenon = Zenon.getSingleton();
      const tokenStandard = Primitives.TokenStandard.parse(zenonToken.address);

      console.log(
        "ercToken?.network?.networkClass, ercToken?.network?.chainId, ercAddress, ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonToken.decimals)).toNumber(), tokenStandard",
        ercToken?.network?.networkClass,
        ercToken?.network?.chainId,
        ercAddress,
        ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonToken.decimals)).toString(),
        tokenStandard
      );

      if (ercToken.network.networkClass && ercToken.network.chainId) {
        const wrap = zenon.embedded.bridge.wrapToken(
          ercToken.network.networkClass,
          ercToken.network.chainId,
          ercAddress,
          ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonToken.decimals)),
          tokenStandard
        );
        console.log("wrap", wrap);

        const transaction = {
          fromAddress: zenonAddress,
          accountBlock: wrap.toJson(),
        };

        try {
          const accountBlock = await zenonClient.sendTransaction(transaction);
          console.log("final accountBlock", accountBlock);
          resolve(accountBlock?.hash.toString());
        } catch (err) {
          console.error(err);
          reject(err);
        }
      } else {
        reject("Invalid network details, please refresh and try again.");
      }
    });
  };

  const addCurrentWrapRequestToList = async (hash: string) => {
    console.log("zenonAddress", zenonAddress);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const currentContractAddress = globalConstants.externalAvailableNetworks.find(
      (net: any) => net.chainId == ercToken.network.chainId
    ).contractAddress;
    console.log("currentContractAddress", currentContractAddress);
    const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    const signedContract = contract.connect(signer);

    // Adding one more block to be certain that the conditions passed
    const redeemDelay = ((await signedContract.tokensInfo(ercToken.address))?.redeemDelay || 1) + 1;

    console.log(
      "(await signedContract.tokensInfo(ercToken.address))",
      await signedContract.tokensInfo(ercToken.address)
    );
    console.log("redeemDelay", redeemDelay);

    const estimatedBlockTimeInSeconds = await signedContract.estimatedBlockTime();

    console.log("estimatedBlockTimeInSeconds", estimatedBlockTimeInSeconds.toNumber());
    console.log("ethers.BigNumber.from(zenonToken.decimals)", ethers.BigNumber.from(zenonToken.decimals));
    console.log("ethers.BigNumber.from(wrapFeePercentage)", ethers.BigNumber.from(wrapFeePercentage));
    console.log(
      "ethers.BigNumber.from(globalConstants.feeDenominator)",
      ethers.BigNumber.from(globalConstants.feeDenominator)
    );
    console.log(
      "ethers.BigNumber.from(zenonToken.decimals).mul(ethers.BigNumber.from(wrapFeePercentage))",
      ethers.BigNumber.from(zenonToken.decimals).mul(ethers.BigNumber.from(wrapFeePercentage))
    );
    console.log(
      "ethers.BigNumber.from(zenonToken.decimals).mul(ethers.BigNumber.from(wrapFeePercentage)).div(ethers.BigNumber.from(globalConstants.feeDenominator))",
      ethers.BigNumber.from(zenonToken.decimals)
        .mul(ethers.BigNumber.from(wrapFeePercentage))
        .div(ethers.BigNumber.from(globalConstants.feeDenominator))
    );

    const feeAmount = ethers.utils
      .parseUnits(zenonAmount, ethers.BigNumber.from(zenonToken.decimals))
      .mul(ethers.BigNumber.from(wrapFeePercentage))
      .div(ethers.BigNumber.from(globalConstants.feeDenominator));
    console.log("feeAmount", feeAmount);

    const requestItem = new WrapRequestItem(
      hash,
      ethers.utils.parseUnits(zenonAmount, ethers.BigNumber.from(zenonToken.decimals)).toString(),
      feeAmount.toString(),
      ercToken?.network?.chainId,
      ercToken?.network?.networkClass,
      redeemDelay * estimatedBlockTimeInSeconds.toNumber(),
      "",
      zenonAddress,
      ercAddress,
      ercToken.address,
      zenonToken.address,
      wrapRequestStatus.Signing,
      zenonToken,
      ercToken,
      Date.now() / 1000,
      true
    );

    dispatch(storeActiveWrapRequest(JSONbig.stringify(requestItem)));

    const currentRequests = JSONbig.parse(localStorage.getItem("wrapRequests") || "[]").map((req: any) =>
      WrapRequestItem.fromJson(req)
    );

    console.log("requestItem", requestItem);

    currentRequests.push(requestItem);
    localStorage.setItem("wrapRequests", JSONbig.stringify(currentRequests));
  };

  const wznnToZnn = async () => {
    const { hash, logIndex } = await sendUnwrapRequest();
    await addCurrentUnwrapRequestToList(hash.slice(2), logIndex);
  };

  const sendUnwrapRequest = async (): Promise<{ hash: any; logIndex: any }> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("ercToken", ercToken);
        const currentContractAddress = globalConstants.externalAvailableNetworks.find(
          (net: any) => net.chainId == ercToken.network.chainId
        ).contractAddress;

        console.log("currentContractAddress", currentContractAddress);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
        const signedContract = contract.connect(signer);

        console.log("contract", contract);
        console.log("signedContract", signedContract);

        const token = new ethers.Contract(ercToken.address, globalConstants.abiToken, provider);

        console.log("token", token);

        const ercTokenCopy = {
          ...ercToken,
          decimals: await token.decimals(),
        };

        const t = token.connect(signer);

        console.log("ercAddress", ercAddress);
        console.log("currentContractAddress", currentContractAddress);

        const allowedAmount = await t.allowance(ercAddress, currentContractAddress);
        console.log(
          "allowedAmount",
          allowedAmount,
          ethers.utils.formatUnits(allowedAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
        );

        if (
          ethers.BigNumber.from(allowedAmount).lt(
            ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
          )
        ) {
          console.log(
            "Approving with",
            currentContractAddress,
            ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
          );
          const approveResponse = await t.approve(
            currentContractAddress,
            ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals))
          );
          console.log("approveResponse", approveResponse);
          await approveResponse.wait();
        }

        console.log(
          "Swapping with ",
          ercTokenCopy.address,
          ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals)),
          zenonAddress
        );

        const referralCode = referralInfo?.referralCode;
        let concatenatedAddresses = zenonAddress;

        if (referralCode) {
          concatenatedAddresses = concatenatedAddresses + "&" + referralCode;
          console.log("Using: ", referralCode);
        }
        console.log("concatenatedAddresses", concatenatedAddresses);

        const swapResponse = await signedContract.unwrap(
          ercTokenCopy.address,
          ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(ercTokenCopy.decimals)),
          concatenatedAddresses
        );
        console.log("swapResponse", swapResponse);
        await swapResponse.wait();

        // This returns the unique id
        resolve({ hash: swapResponse?.hash || "", logIndex: swapResponse?.logIndex || 0 });
      } catch (err: any) {
        console.error(err);

        let readableError = JSONbig.stringify(err);

        if (readableError.includes(`Wrong signature`)) readableError = "Wrong transaction signature.";
        else if (
          readableError.includes(`user rejected transaction`) ||
          readableError.includes("User denied transaction")
        )
          readableError = "You rejected the Metamask transaction.";
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

  const addCurrentUnwrapRequestToList = async (hash: string, logIndex: number) => {
    console.log("zenonAddress", zenonAddress);

    const redeemDelay = globalConstants.tokenPairs.find(
      (pair: any) => pair.internalToken.address == zenonToken.address && pair.externalToken.address == ercToken.address
    )?.unwrapRedeemDelay;

    const feeAmount = ethers.utils
      .parseUnits(ercAmount, ethers.BigNumber.from(zenonToken.decimals))
      .mul(unwrapFeePercentage / globalConstants.feeDenominator);

    const requestItem = new UnwrapRequestItem(
      hash,
      ethers.utils.parseUnits(ercAmount, ethers.BigNumber.from(zenonToken.decimals)).toString(),
      feeAmount.toString(),
      ercToken.network.chainId,
      ercToken.network.networkClass,
      -1,
      redeemDelay * globalConstants.estimatedMomentumTimeInSeconds,
      "",
      ercAddress,
      zenonAddress,
      ercToken.address,
      zenonToken.address,
      unwrapRequestStatus.Signing,
      ercToken,
      zenonToken,
      Date.now() / 1000,
      true,
      hash + logIndex,
      logIndex
    );

    dispatch(storeActiveUnwrapRequest(JSONbig.stringify(requestItem)));

    const currentRequests = JSONbig.parse(localStorage.getItem("wrapRequests") || "[]").map((req: any) =>
      WrapRequestItem.fromJson(req)
    );

    console.log("requestItem", requestItem);

    currentRequests.push(requestItem);
    localStorage.setItem("wrapRequests", JSONbig.stringify(currentRequests));
  };

  /**
   * * GTM SERVICE
   */
  const sendDataToGTM = useGTMDispatch()

  const onFormSubmit = async () => {
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting approval from wallet</div>
      </>,
      "extension-approval-spinner-root"
    );
    setIsNextDisabled(true);
    try {
      if (!isUnwrapDirection) {
        // ZNN => WZNN
        await znnToWznn();
      } else {
        // WZNN => ZNN
        await wznnToZnn();

        /**
         * * GTM SERVICE
         * ? Sending data to GTM
         */
        sendDataToGTM({
          event: 'attribute', 
          action: 'attribute', 
          category: 'bridge_tokens', 
          event_category: 'bridge_tokens', 
          event_label: `swap_wznn_znn_${ercAmount}`, 
          event_value: ercAmount,
          label: `swap_wznn_znn_${ercAmount}`, 
          value: ercAmount, 
        })
      }

      showSpinner(false);
      setIsNextDisabled(false);

      console.log("onFormSubmit");

      onStepSubmit();
    } catch (err: any) {
      setIsNextDisabled(false);
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
        <div className={`flow-order ${isUnwrapDirection ? "" : "reversed-order"}`}>
          <div className="fromToken w-100 mt-5" key="fromToken">
            <div className="direction-label-container">
              {isUnwrapDirection ? (
                <div className="direction-label">To</div>
              ) : (
                <div className="direction-label">From</div>
              )}
            </div>

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
                  placeholder={"Select Token / Network"}
                  error={errors.zenonToken}
                  {...register("zenonToken", { required: true })}
                />
                <div className={`input-error ${errors.zenonToken?.type === "required" ? "" : "invisible"}`}>
                  Token is required
                </div>
              </div>

              <div className="custom-control flex-1 min-width-100">
                <input
                  {...register("zenonAddress", { required: true })}
                  className={`w-100 h-100 address-field custom-label ${errors.zenonAddress ? "custom-label-error" : ""
                    }`}
                  placeholder="Type your address"
                  value={zenonAddress}
                  onChange={(e) => {
                    setZenonAddress(e.target.value);
                    setValue("zenonAddress", e.target.value, { shouldValidate: true });
                  }}
                  type="text"></input>
                <div className="input-label">{"Address"}</div>

                <div className={`input-error ${errors.zenonAddress?.type === "required" ? "" : "invisible"}`}>
                  Address is required
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end align-items-center height-30px">
              <div className="mt-1 text-right">
                {"Balance: "}
                {zenonBalance + " " + zenonToken?.symbol}
              </div>
            </div>

            <div className="custom-control mt-2">
              <div className={`input-with-button w-100`}>
                <input
                  {...register("zenonAmountField", {
                    required: true,
                    min: {
                      value: minZenonAmount.toString(),
                      message: "Minimum of " + (minZenonAmount + ""),
                    },
                    max: {
                      value: isUnwrapDirection ? subtractFee(ercBalance, isUnwrapDirection) : zenonBalance,
                      message:
                        "Maximum of " + (isUnwrapDirection ? subtractFee(ercBalance, isUnwrapDirection) : zenonBalance),
                    },
                  })}
                  className={`w-100 custom-label pr-3 ${errors.zenonAmountField ? "custom-label-error" : ""}`}
                  placeholder={"0.0"}
                  value={zenonAmount}
                  onChange={(e) => {
                    updateZenonAmount(e.target.value, true, isUnwrapDirection);
                  }}
                  type="text"></input>
                <div className="input-label">{zenonToken?.symbol + " amount"}</div>
                <div
                  className={(zenonToken?.symbol === "ZNN" ? "primary" : "accent") + " input-chip-button"}
                  onClick={() => {
                    updateZenonAmount(
                      (isUnwrapDirection ? subtractFee(ercBalance, isUnwrapDirection) : zenonBalance) + "",
                      true,
                      isUnwrapDirection
                    );
                  }}>
                  <span>
                    {"MAX ~ " +
                      parseFloat(
                        (isUnwrapDirection ? subtractFee(ercBalance, isUnwrapDirection) : zenonBalance) + ""
                      ).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className={`input-error ${errors.zenonAmountField ? "" : "invisible"}`}>
                {errors.zenonAmountField?.message + "" || "Amount is required"}
              </div>
            </div>

            {!isUnwrapDirection && (
              <div className={`switch-direction-button-container mt-4 ${isUnwrapDirection ? "invisible" : ""}`}>
                <div onClick={() => switchDirection()} className={`switch-direction-button primary`}>
                  <img alt="switch-tokens" className="switch-arrow" src={arrowDownIcon}></img>
                  <img alt="switch-tokens" className="second-switch-arrow" src={arrowDownIcon}></img>
                </div>
              </div>
            )}
          </div>

          <div className="toToken w-100 mt-5" key="toToken">
            <div className="direction-label-container">
              {isUnwrapDirection ? (
                <div className="direction-label">From</div>
              ) : (
                <div className="direction-label">To</div>
              )}
            </div>

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
                <input
                  {...register("ercAddress", { required: true })}
                  className={`w-100 h-100 address-field custom-label ${errors.ercAddress ? "custom-label-error" : ""}`}
                  placeholder="Type your address"
                  value={ercAddress}
                  onChange={(e) => {
                    setErcAddress(e.target.value);
                    setValue("ercAddress", e.target.value, { shouldValidate: true });
                  }}
                  type="text"></input>
                <div className="input-label">{"Address"}</div>

                <div className={`input-error ${errors.ercAddress?.type === "required" ? "" : "invisible"}`}>
                  Address is required
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center height-30px">
              <div className="text-button" onClick={addTokenToMetamask}>
                <span className="mr-1 text-nowrap">Add token to metamask</span>
                <img
                  alt="text-button-icon"
                  className="text-button-icon"
                  src={require("./../../../assets/logos/metamask.png")}></img>
              </div>

              <div className="mt-1 text-right">
                {"Balance: "}
                {ercBalance + " " + ercToken?.symbol}
              </div>
            </div>

            <div className="custom-control mt-2">
              <div className={`input-with-button w-100`}>
                <input
                  {...register("ercAmountField", {
                    required: true,
                    min: {
                      value: minErcAmount.toString(),
                      message: "Minimum of " + (minErcAmount + ""),
                    },
                    max: {
                      value: isUnwrapDirection ? ercBalance : subtractFee(zenonBalance, isUnwrapDirection),
                      message:
                        "Maximum of " + (isUnwrapDirection ? ercBalance : subtractFee(zenonBalance, isUnwrapDirection)),
                    },
                  })}
                  className={`w-100 custom-label pr-3 ${errors.ercAmountField ? "custom-label-error" : ""}`}
                  placeholder={"0.0"}
                  value={ercAmount}
                  onChange={(e) => {
                    updateErcAmount(e.target.value, true, isUnwrapDirection);
                  }}
                  type="text"></input>
                <div className="input-label">{ercToken?.symbol + " amount"}</div>
                <div
                  className={(ercToken?.symbol === "ZNN" ? "primary" : "accent") + " input-chip-button"}
                  onClick={() => {
                    updateErcAmount(
                      (isUnwrapDirection ? ercBalance : subtractFee(zenonBalance, isUnwrapDirection)) + "",
                      true,
                      isUnwrapDirection
                    );
                  }}>
                  <span>
                    {"MAX ~ " +
                      parseFloat(
                        (isUnwrapDirection ? ercBalance : subtractFee(zenonBalance, isUnwrapDirection)) + ""
                      ).toFixed(0)}
                  </span>
                </div>
              </div>

              <div className={`input-error ${errors.ercAmountField ? "" : "invisible"}`}>
                {errors.ercAmountField?.message + "" || "Amount is required"}
              </div>
            </div>

            {isUnwrapDirection && (
              <div className={`switch-direction-button-container mt-4 ${isUnwrapDirection ? "" : "invisible"}`}>
                <div onClick={() => switchDirection()} className={`switch-direction-button primary`}>
                  <img alt="switch-tokens" className="switch-arrow" src={arrowDownIcon}></img>
                  <img alt="switch-tokens" className="second-switch-arrow" src={arrowDownIcon}></img>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-start mt-1">
          <img alt="fees-info" className="switch-arrow mr-1" src={infoIcon}></img>
          {isUnwrapDirection ? (
            <>
              <div className="text-nowrap">{"Fees: No fees."}</div>
            </>
          ) : (
            <>
              <span className="text-nowrap">
                {"Fees: " +
                  parseFloat(zenonAmount || "0") +
                  " * " +
                  (wrapFeePercentage * 100) / globalConstants.feeDenominator +
                  "% = "}
              </span>
              <b className="ml-1 text-nowrap">
                {parseFloat(
                  parseFloat(zenonAmount || "0") * (wrapFeePercentage / globalConstants.feeDenominator) + ""
                ).toFixed(2) +
                  " " +
                  zenonToken.symbol}
              </b>
            </>
          )}
        </div>

        {isUnwrapDirection ? (
          <div className="d-flex flex-wrap justify-content-start mt-1">
            <img alt="fees-info" className="switch-arrow mr-1" src={referralCode ? infoIconBlue : infoIconRed}></img>
            {referralCode ? (
              <div>
                <b className="text-qsr">BONUS:</b>
                <span className="text-nowrap">{" You will get 1% because you are using a referral code"}</span>
              </div>
            ) : (
              <a
                className="no-decoration text-white"
                href="https://twitter.com/hashtag/HyperGrowth"
                target="_blank"
                rel="noreferrer">
                <span className="text-nowrap text-attention-grabber p-relative">
                  {"Click here to find a referral link and get 1% bonus "}
                </span>
              </a>
            )}
          </div>
        ) : (
          <></>
        )}

        <div className="d-flex flex-wrap justify-content-start mt-1">
          {!isUnwrapDirection ? (
            <>
              {hasLowPlasma(plasmaBalance) ? (
                <div className="d-flex align-items-center">
                  <img alt="fees-info" className="switch-arrow mr-1" src={warningIcon} />

                  <div>
                    It seems that you have{" "}
                    <span className="text-warning text-bold tooltip">
                      low plasma
                      <span className="tooltip-text">{`Current plasma: ${plasmaBalance || 0}`}</span>
                    </span>
                    . We recommend fusing at least 50 QSR in the Syrius extension before making the transaction in order
                    to speed up the process.
                  </div>
                </div>
              ) : (
                <></>
              )}
            </>
          ) : (
            <></>
          )}
        </div>

        <div className={`button primary w-100 mt-2 ${Object.keys(errors).length || isNextDisabled ? "disabled" : ""}`}>
          {isNextDisabled ? "Waiting for approval from wallet..." : isUnwrapDirection ? "Unwrap Token" : "Wrap Token"}
          <input className="ghost-over cursor-pointer" type="submit" name="submitButton"></input>
        </div>
      </form>
    </div>
  );
};

export default SwapStep;
