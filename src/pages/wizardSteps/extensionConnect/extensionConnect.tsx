/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Primitives, Zenon } from "znn-ts-sdk";
import { AccountInfo } from "znn-ts-sdk/dist/lib/src/model/nom/account_info";
import { Address } from "znn-ts-sdk/dist/lib/src/model/primitives/address";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import { internalNetworkProviderTypes } from "../../../services/hooks/internalNetwork-provider/internalNetworkContext";
import { storeMomentumHeight } from "../../../services/redux/internalNetworkConnectionSlice";
import { storeGlobalConstants } from "../../../services/redux/globalConstantsSlice";
import { storeReferralCode } from "../../../services/redux/referralSlice";
import { storeErcInfo, storeZenonInfo } from "../../../services/redux/walletSlice";
import {
  checkIfBridgeCanProcessRequests,
  checkMetamaskAvailability,
  checkSyriusAvailability,
  curateExternalNetworksForSupernova,
  curateExternalTokensForSupernova,
  curateInternalTokensForSupernova,
  getExternalTokensDetails,
  getInternalTokensDetails,
  getLiquidityPairsDetails,
  getReferralAddress,
  getZenonTokenInfo,
  mapObject,
  openSafelyInNewTab,
  updateExternalLiquidityTokensBasedOnTokenPairs,
  updateInternalLiquidityTokensBasedOnTokenPairs,
  updateTokenPairsWithNewExternalTokens,
  updateTokenPairsWithNewInternalTokens,
  validateExternalNetwork,
} from "../../../utils/utils";
import { simpleNetworkType, simpleTokenType } from "../swapStep/swapStep";
import closeIconRed from "./../../../assets/icons/close-red.svg";
import infoIcon from "./../../../assets/info-icon.svg";
import metamaskLogo from "./../../../assets/logos/metamask.svg";
import syriusLogo from "./../../../assets/logos/syrius-logo.svg";
import twitterLogo from "./../../../assets/logos/twitter.svg";
import zenonLogo from "./../../../assets/networks/zenon.svg";
import ethLogo from "./../../../assets/networks/eth.svg";
import walletConnectLogo from "./../../../assets/logos/walletConnect.svg";
import bnbNetworkIcon from "./../../../assets/networks/bnb.svg";
import znnNetworkIcon from "./../../../assets/networks/zenon.svg";
import supernovaNetworkIcon from "./../../../assets/networks/supernova.png";
import ethPurpleIcon from "./../../../assets/tokens/eth-purple.svg";
import qsrTokenIcon from "./../../../assets/tokens/qsr.svg";
import wqsrTokenIcon from "./../../../assets/tokens/wqsr.svg";
import wznnTokenIcon from "./../../../assets/tokens/wznn.svg";
import znnTokenIcon from "./../../../assets/tokens/znn.svg";
import xZnnTokenIcon from "./../../../assets/tokens/xznn.png";
import "./extensionConnect.scss";
import { externalNetworkProviderTypes } from "../../../services/hooks/externalNetwork-provider/externalNetworkContext";
import useExternalNetwork from "../../../services/hooks/externalNetwork-provider/useExternalNetwork";
import useInternalNetwork from "../../../services/hooks/internalNetwork-provider/useInternalNetwork";
import { AssetData } from "../../../services/hooks/externalNetwork-provider/externalNetworkWalletConnectWrapper";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ExtensionConnect = ({ onStepSubmit = (where: string) => {}, isLiquidityFlow = false }) => {
  const zenon = Zenon.getSingleton();

  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const [isSyriusConnected, setIsSyriusConnected] = useState(false);

  const referralInfo = useSelector((state: any) => state.referral);
  const [isReferralCodeApplied, setIsReferralCodeApplied] = useState(referralInfo.referralCode || false);

  const [metamaskAddress, setMetamaskAddress] = useState("");
  const [syriusAddress, setSyriusAddress] = useState("");

  const [isValidated, setIsValidated] = useState(false);
  const { handleSpinner } = useContext(SpinnerContext);

  const dispatch = useDispatch();
  const storedConstants = useSelector((state: any) => state.globalConstants);
  const [globalConstants, setGlobalConstants] = useState(storedConstants);

  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const { internalNetworkClient } = useInternalNetwork();
  const { externalNetworkClient } = useExternalNetwork();

  const [hasParingsOrSessions, setHasParingsOrSessions] = useState(false);
  const [isSyriusExtensionEnabled, setIsSyriusExtensionEnabled] = useState(false);

  useEffect(() => {
    setIsReferralCodeApplied(!!referralInfo.referralCode);
  }, [referralInfo.referralCode]);

  useEffect(() => {
    console.log("extensionConnect - serializedWalletInfo", serializedWalletInfo);
    const zenonInfo = JSONbig.parse(serializedWalletInfo?.["zenonInfo"] || "{}");
    if (zenonInfo && zenonInfo?.address) {
      console.log("extensionConnect - zenonInfo", zenonInfo);
      setSyriusAddress(zenonInfo?.address);
      setIsSyriusConnected(true);
    } else {
      setSyriusAddress("");
      setIsSyriusConnected(false);
    }

    const ercInfo = JSONbig.parse(serializedWalletInfo?.["ercInfo"] || "{}");
    if (ercInfo && ercInfo?.address) {
      console.log("extensionConnect - ercInfo", ercInfo);
      setMetamaskAddress(ercInfo?.address);
      setIsMetamaskConnected(true);
    } else {
      setMetamaskAddress("");
      setIsMetamaskConnected(false);
    }

    if (zenonInfo?.address && ercInfo?.address) {
      setIsValidated(true);
    } else {
      setIsValidated(false);
    }
  }, [serializedWalletInfo]);

  useEffect(() => {
    console.log("extensionConnect - internalNetworkClient", internalNetworkClient);
  }, [internalNetworkClient]);

  useEffect(() => {
    console.log(localStorage.getItem("wc@2:core:0.3//pairing"), localStorage.getItem("wc@2:client:0.3//session"));

    if (
      localStorage.getItem("wc@2:core:0.3//pairing")?.length ||
      localStorage.getItem("wc@2:client:0.3//session")?.length
    ) {
      setHasParingsOrSessions(true);
    } else {
      setHasParingsOrSessions(false);
    }
  }, []);

  const connectToInternalNetwork = async (providerType: internalNetworkProviderTypes) => {
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting approval from wallet</div>
      </>,
      "extension-approval-spinner-root"
    );
    console.log("connecting syrius");
    showSpinner(true);

    const onModalClose = (reason: { [key: string]: any }) => {
      console.log("WalletConnect modal closed", reason);
      showSpinner(false);
    };

    try {
      let zenonInfo;

      if (providerType == internalNetworkProviderTypes.syriusExtension) {
        checkSyriusAvailability();
        await internalNetworkClient.init(internalNetworkProviderTypes.syriusExtension);
        await internalNetworkClient.connectSyrius(internalNetworkProviderTypes.syriusExtension, onModalClose);
        zenonInfo = await internalNetworkClient.getWalletInfo(internalNetworkProviderTypes.syriusExtension);

        console.log("zenonInfo", zenonInfo);

        await internalNetworkClient.connectToNode(zenonInfo.nodeUrl);
      } else {
        if (providerType == internalNetworkProviderTypes.walletConnect) {
          await internalNetworkClient.init(internalNetworkProviderTypes.walletConnect);
          await internalNetworkClient.connectSyrius(internalNetworkProviderTypes.walletConnect, onModalClose);

          // modal.close() is called when the process is finished
          // and onModalClose is triggered and so the showSpinner(false) is called.
          // Start the spinner again for the getWalletInfo request.
          showSpinner(true);
          zenonInfo = await internalNetworkClient.getWalletInfo(internalNetworkProviderTypes.walletConnect);
          console.log("zenonInfo", zenonInfo);
          await internalNetworkClient.connectToNode(zenonInfo.nodeUrl);
        }
      }

      const isBridgeProcessingTransactions = await checkIfBridgeCanProcessRequests(zenon);
      if (!isBridgeProcessingTransactions?.canProcessWrapRequests) {
        toast("Bridge might be down and unable to process Wrap requests! Please be patient.", {
          position: "bottom-center",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "error",
          theme: "dark",
        });
      }
      if (!isBridgeProcessingTransactions?.canProcessUnwrapRequests) {
        toast("Bridge might be down and unable to process Unwrap transactions! Please be patient.", {
          position: "bottom-center",
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "error",
          theme: "dark",
        });
      }

      checkForAffiliationCodeFromNode(zenon);

      setSyriusAddress(zenonInfo.address);
      const zenonWalletInfo = await getBalances(zenonInfo.address);
      console.log("zenonWalletInfo", zenonWalletInfo);
      console.log("JSON.stringify(zenonWalletInfo)", JSON.stringify(zenonWalletInfo));

      let updatedConstants = await updateGlobalConstantsWithBridgeInfo();
      console.log("globalConstants", updatedConstants);
      console.log("updatedConstants.internalAvailableTokens", updatedConstants.internalAvailableTokens);
      console.log(
        "JSON.stringify(updatedConstants.internalAvailableTokens)",
        JSON.stringify(updatedConstants.internalAvailableTokens)
      );
      zenonWalletInfo.balanceInfoMap = await mapObject(
        updatedConstants.internalAvailableTokens,
        async (tok: simpleTokenType) => {
          if (zenonWalletInfo.balanceInfoMap[tok.address]) {
            return {
              ...tok,
              balance: zenonWalletInfo.balanceInfoMap[tok.address].balance.toString(),
              symbol: zenonWalletInfo.balanceInfoMap[tok.address].token.symbol,
              decimals: zenonWalletInfo.balanceInfoMap[tok.address].token.decimals,
              name: zenonWalletInfo.balanceInfoMap[tok.address].token.name,
            };
          } else {
            const tokenInfo = await getZenonTokenInfo(tok.address, zenon);
            console.log("tokenInfo", tokenInfo);
            return {
              ...tok,
              symbol: tokenInfo?.symbol,
              decimals: tokenInfo?.decimals,
              name: tokenInfo?.name,
            };
          }
        }
      );
      console.log("JSON.stringify(zenonWalletInfo.balanceInfoMap)", JSON.stringify(zenonWalletInfo.balanceInfoMap));

      if (!globalConstants.isSupernovaNetwork) {
        updatedConstants = await updateGlobalConstantsWithLiquidityInfo(
          zenon,
          updatedConstants,
          Primitives.Address.parse(zenonInfo.address)
        );
      }

      dispatch(storeZenonInfo(JSONbig.stringify(zenonWalletInfo)));
      setIsSyriusConnected(true);
      showSpinner(false);

      console.log("Removing event listener");
    } catch (err: any) {
      console.error("connectSyrius error", err);
      showSpinner(false);
      let readableError = err;
      if (err?.message) {
        readableError = err?.message;
      }
      readableError =
        readableError?.split(`"Error:`)?.pop()?.split(`"`)[0] ||
        readableError?.split(`'Error:`)?.pop()?.split(`'`)[0] ||
        "";

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
      return err;
    }
  };

  const getMetamaskAddress = async () => {
    const provider = await externalNetworkClient.getProvider(externalNetworkProviderTypes.metamask);
    console.log("provider", provider);

    console.log("connectToExternalNetwork, globalConstants", globalConstants);

    const metamaskCurrentChainId = (await provider.getNetwork())?.chainId;
    await validateExternalNetwork(
      provider,
      [...globalConstants.externalAvailableNetworks, ...globalConstants.liquidityInternalNetworks],
      metamaskCurrentChainId
    );

    const accounts = await provider.send("eth_requestAccounts", []);
    console.log("accounts", accounts);

    return {
      provider: provider,
      address: accounts[0],
      chainId: metamaskCurrentChainId,
    };
  };

  const onModalDismiss = (spinnerHandle: any, reason?: string) => {
    console.log("Wallet connect modal closed", reason);
    spinnerHandle(false);
  };

  const connectToExternalNetwork = async (providerType: externalNetworkProviderTypes) => {
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold text-center mb-5 mt-4">Waiting approval from wallet</div>
      </>,
      "extension-approval-spinner-root"
    );
    console.log("connecting metamask");
    try {
      showSpinner(true);
      let externalNetworkAddress = "";
      let externalNetworkChainId: number;
      let provider: any;
      let wznnBalance = "";
      let currentToken: any;
      let updatedConstants: any;

      if (providerType == externalNetworkProviderTypes.metamask) {
        const externalNetworkDetails = await getMetamaskAddress();
        externalNetworkAddress = externalNetworkDetails.address;
        externalNetworkChainId = externalNetworkDetails.chainId;
        provider = externalNetworkDetails.provider;

        currentToken = globalConstants.externalAvailableTokens.find(
          (tok: any) => tok.isAvailable && externalNetworkChainId === tok.network.chainId
        );
        console.log("globalConstants.externalAvailableTokens", globalConstants.externalAvailableTokens);
        console.log("externalNetworkChainId", externalNetworkChainId);

        // ToDo create contract with selected external token (make wznn ABI as default but get it from internalAvTok)
        console.log("new Contract", currentToken.address, globalConstants.wznnAbi, provider);

        const contract = new ethers.Contract(currentToken.address, globalConstants.wznnAbi, provider);
        const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
        const signedContract = contract.connect(signer);

        const rawWznnBalance = await signedContract.balanceOf(externalNetworkAddress);
        wznnBalance = ethers.utils.formatUnits(rawWznnBalance, currentToken.decimals);

        setMetamaskAddress(externalNetworkAddress);

        const updatedInternalTokens = await getInternalTokensDetails(globalConstants.internalAvailableTokens, zenon);
        let updatedTokenPairs = updateTokenPairsWithNewInternalTokens(
          globalConstants.tokenPairs,
          updatedInternalTokens
        );
        console.log("updatedInternalTokens", updatedInternalTokens);
        console.log("updatedTokenPairs", updatedTokenPairs);

        const updatedExternalTokens = await getExternalTokensDetails(globalConstants.externalAvailableTokens, provider);
        updatedTokenPairs = updateTokenPairsWithNewExternalTokens(updatedTokenPairs, updatedExternalTokens);
        console.log("updatedExternalTokens", updatedExternalTokens);
        console.log("updatedTokenPairs", updatedTokenPairs);

        if (!globalConstants.isSupernovaNetwork) {
          const externalLiquidityTokens = await getExternalTokensDetails(
            globalConstants.liquidityExternalTokens,
            provider
          );
          let updatedLiquidityTokenPairs = updateTokenPairsWithNewExternalTokens(
            globalConstants.liquidityTokenPairs,
            externalLiquidityTokens
          );
          console.log("externalLiquidityTokens", externalLiquidityTokens);
          console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

          // We do this because even if it's called internal tokens, they are still erc-20 tokens
          const internalLiquidityTokens = await getExternalTokensDetails(
            globalConstants.liquidityInternalTokens,
            provider
          );
          updatedLiquidityTokenPairs = updateTokenPairsWithNewInternalTokens(
            globalConstants.liquidityTokenPairs,
            internalLiquidityTokens
          );
          console.log("internalLiquidityTokens", internalLiquidityTokens);
          console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

          const liquidityTokenPairs: any = await getLiquidityPairsDetails(updatedLiquidityTokenPairs, provider);
          console.log("getLiquidityPairsDetails", liquidityTokenPairs);

          const availableExternalLiquidityTokens = updateExternalLiquidityTokensBasedOnTokenPairs(
            externalLiquidityTokens,
            liquidityTokenPairs
          );
          const availableInternalLiquidityTokens = updateInternalLiquidityTokensBasedOnTokenPairs(
            internalLiquidityTokens,
            liquidityTokenPairs
          );
          updatedConstants = {
            ...globalConstants,
            internalAvailableTokens: updatedInternalTokens,
            externalAvailableTokens: updatedExternalTokens,
            tokenPairs: updatedTokenPairs,
            liquidityExternalTokens: availableExternalLiquidityTokens,
            liquidityInternalTokens: availableInternalLiquidityTokens,
            liquidityTokenPairs: liquidityTokenPairs,
          };
        } else {
          updatedConstants = {
            ...globalConstants,
            internalAvailableTokens: updatedInternalTokens,
            externalAvailableTokens: updatedExternalTokens,
            tokenPairs: updatedTokenPairs,
          };
        }

        await externalNetworkClient.init(externalNetworkProviderTypes.metamask);
        await externalNetworkClient.connect(externalNetworkProviderTypes.metamask);

        const _provider = await externalNetworkClient.getProvider(
          externalNetworkProviderTypes.metamask,
          externalNetworkChainId
        );
        console.log("Web3Provider provider", _provider);

        const eipInfo = await externalNetworkClient.getWalletInfo(_provider, externalNetworkProviderTypes.metamask);
        console.log("eipInfo", eipInfo);

        // await externalNetworkClient.connectSyrius(externalNetworkProviderTypes.metamask, onModalDismiss);
        // zenonInfo = await externalNetworkClient.getWalletInfo(externalNetworkProviderTypes.metamask);
        // console.log("zenonInfo", zenonInfo);
        // await externalNetworkClient.connectToNode(zenonInfo.nodeUrl);
      } else {
        if (providerType == externalNetworkProviderTypes.walletConnect) {
          // ToDo: treat the case where the user closes the walletConnect Modal
          // console.log("old provider", new ethers.providers.Web3Provider(window.ethereum));

          // const provider = await externalNetworkClient.getProvider(providerType);
          // console.log("WC provider", provider);

          // const enabled = provider.enable();
          // console.log("WC enabled", enabled);
          // console.log("WC provider", provider);

          // const connected = provider.connect();
          // console.log("WC connected", connected);
          // console.log("WC provider", provider);

          console.log("externalNetworkClient", externalNetworkClient);
          await externalNetworkClient.init(externalNetworkProviderTypes.walletConnect);

          //
          // ToDo: solve the fact that the change events are registered without a provider here.
          // And can't have the updated provider when called
          //
          const connectionInfo = await externalNetworkClient.connect(
            externalNetworkProviderTypes.walletConnect,
            onModalDismiss(showSpinner)
          );
          console.log("externalNetworkClient - connected");
          console.log("connectionInfo", connectionInfo);
          externalNetworkChainId = connectionInfo.chainId;

          const provider = await externalNetworkClient.getProvider(
            externalNetworkProviderTypes.walletConnect,
            externalNetworkChainId
          );
          console.log("JsonRpcProvider provider", provider);

          const eipInfo = await externalNetworkClient.getWalletInfo(
            provider,
            externalNetworkProviderTypes.walletConnect
          );
          console.log("eipInfo", eipInfo);

          // const firstAccount = Object.keys(eipInfo)[0];
          // const firstAccountAddress = firstAccount.split(":")[2];
          // const firstAccountChainId = parseInt(firstAccount.split(":")[1]);

          //
          // IMPORTANT TO DO: DELETE THIS AND USE THE PROPER CHAIN ID
          //
          // externalNetworkChainId = eipInfo.chainId;
          // externalNetworkChainId = parseInt(firstAccount.split(":")[1]);

          currentToken = globalConstants.externalAvailableTokens.find(
            (tok: any) => tok.isAvailable && externalNetworkChainId === tok.network.chainId
          );

          externalNetworkAddress = connectionInfo.address;

          console.log("chainId", externalNetworkChainId);
          console.log("externalNetworkAddress", externalNetworkAddress);
          console.log("currentToken", currentToken);

          // ToDo: how to get details about the token from wrappers in order to have it here?
          // wznnBalance =
          //   eipInfo[externalNetworkAddress].find((asset: AssetData) => {
          //     return asset.symbol == currentToken.symbol;
          //   }) || "0";

          // wznnBalance = externalNetworkClient.getBalance()
          wznnBalance = "0";

          setMetamaskAddress(externalNetworkAddress);

          const updatedInternalTokens = await getInternalTokensDetails(globalConstants.internalAvailableTokens, zenon);
          let updatedTokenPairs = updateTokenPairsWithNewInternalTokens(
            globalConstants.tokenPairs,
            updatedInternalTokens
          );
          console.log("updatedInternalTokens", updatedInternalTokens);
          console.log("updatedTokenPairs", updatedTokenPairs);

          const updatedExternalTokens = await getExternalTokensDetails(
            globalConstants.externalAvailableTokens,
            provider
          );
          updatedTokenPairs = updateTokenPairsWithNewExternalTokens(updatedTokenPairs, updatedExternalTokens);
          console.log("updatedExternalTokens", updatedExternalTokens);
          console.log("updatedTokenPairs", updatedTokenPairs);

          if (!globalConstants.isSupernovaNetwork) {
            const externalLiquidityTokens = await getExternalTokensDetails(
              globalConstants.liquidityExternalTokens,
              provider
            );
            let updatedLiquidityTokenPairs = updateTokenPairsWithNewExternalTokens(
              globalConstants.liquidityTokenPairs,
              externalLiquidityTokens
            );
            console.log("externalLiquidityTokens", externalLiquidityTokens);
            console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

            // We do this because even if it's called internal tokens, they are still erc-20 tokens
            const internalLiquidityTokens = await getExternalTokensDetails(
              globalConstants.liquidityInternalTokens,
              provider
            );
            updatedLiquidityTokenPairs = updateTokenPairsWithNewInternalTokens(
              globalConstants.liquidityTokenPairs,
              internalLiquidityTokens
            );
            console.log("internalLiquidityTokens", internalLiquidityTokens);
            console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

            const liquidityTokenPairs: any = await getLiquidityPairsDetails(updatedLiquidityTokenPairs, provider);
            console.log("getLiquidityPairsDetails", liquidityTokenPairs);

            const availableExternalLiquidityTokens = updateExternalLiquidityTokensBasedOnTokenPairs(
              externalLiquidityTokens,
              liquidityTokenPairs
            );
            const availableInternalLiquidityTokens = updateInternalLiquidityTokensBasedOnTokenPairs(
              internalLiquidityTokens,
              liquidityTokenPairs
            );

            updatedConstants = {
              ...globalConstants,
              internalAvailableTokens: updatedInternalTokens,
              externalAvailableTokens: updatedExternalTokens,
              tokenPairs: updatedTokenPairs,
              liquidityExternalTokens: availableExternalLiquidityTokens,
              liquidityInternalTokens: availableInternalLiquidityTokens,
              liquidityTokenPairs: liquidityTokenPairs,
            };
          } else {
            updatedConstants = {
              ...globalConstants,
              internalAvailableTokens: updatedInternalTokens,
              externalAvailableTokens: updatedExternalTokens,
              tokenPairs: updatedTokenPairs,
            };
          }
        }
      }

      dispatch(storeGlobalConstants(updatedConstants));
      console.log("updatedConstants after metamask data", updatedConstants);
      setGlobalConstants(updatedConstants);

      dispatch(storeErcInfo(JSON.stringify({ address: externalNetworkAddress?.toLowerCase(), balance: wznnBalance })));

      if (isSyriusConnected) {
        setIsValidated(true);
      }

      setIsMetamaskConnected(true);
    } catch (err: any) {
      console.error(err);

      let readableError = err;
      if (err?.message) {
        readableError = err?.message;
      }
      readableError =
        readableError?.split(`"Error:`)?.pop()?.split(`"`)[0] ||
        readableError?.split(`'Error:`)?.pop()?.split(`'`)[0] ||
        "";

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
      return err;
    } finally {
      showSpinner(false);
    }
  };

  // const connectMetamask = async () => {
  //   const showSpinner = handleSpinner(
  //     <>
  //       <div className="text-bold text-center mb-5 mt-4">Waiting approval from the wallet</div>
  //     </>,
  //     "extension-approval-spinner-root"
  //   );
  //   console.log("connecting metamask");
  //   try {
  //     checkMetamaskAvailability();
  //     const provider = new ethers.providers.Web3Provider(window.ethereum);

  //     console.log("connectMetamask, globalConstants", globalConstants);

  //     const metamaskCurrentChainId = (await provider.getNetwork())?.chainId;
  //     await validateExternalNetwork(
  //       provider,
  //       [...globalConstants.externalAvailableNetworks, ...globalConstants.liquidityInternalNetworks],
  //       metamaskCurrentChainId
  //     );

  //     const accounts = await provider.send("eth_requestAccounts", []);

  //     setMetamaskAddress(accounts[0]);

  //     const currentToken = globalConstants.externalAvailableTokens.find(
  //       (tok: any) => tok.isAvailable && metamaskCurrentChainId === tok.network.chainId
  //     )?.address;

  //     console.log("new Contract", currentToken, globalConstants.wznnAbi, provider);

  //     // TODO: Make sure the ABI is correct when/if adding more tokens for the bridge.
  //     const contract = new ethers.Contract(currentToken, globalConstants.wznnAbi, provider);
  //     const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  //     const signedContract = contract.connect(signer);

  //     console.log("accounts", accounts);

  //     const rawWznnBalance = await signedContract.balanceOf(accounts[0]);
  //     const wznnBalance = ethers.utils.formatUnits(rawWznnBalance, currentToken.decimals);

  //     const updatedInternalTokens = await getInternalTokensDetails(globalConstants.internalAvailableTokens, zenon);
  //     let updatedTokenPairs = updateTokenPairsWithNewInternalTokens(globalConstants.tokenPairs, updatedInternalTokens);

  //     console.log("updatedInternalTokens", updatedInternalTokens);
  //     console.log("updatedTokenPairs", updatedTokenPairs);

  //     const updatedExternalTokens = await getExternalTokensDetails(globalConstants.externalAvailableTokens, provider);
  //     updatedTokenPairs = updateTokenPairsWithNewExternalTokens(updatedTokenPairs, updatedExternalTokens);

  //     console.log("updatedExternalTokens", updatedExternalTokens);
  //     console.log("updatedTokenPairs", updatedTokenPairs);

  //     const externalLiquidityTokens = await getExternalTokensDetails(globalConstants.liquidityExternalTokens, provider);
  //     let updatedLiquidityTokenPairs = updateTokenPairsWithNewExternalTokens(
  //       globalConstants.liquidityTokenPairs,
  //       externalLiquidityTokens
  //     );

  //     console.log("externalLiquidityTokens", externalLiquidityTokens);
  //     console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

  //     // We do this because even if they're called internal tokens, they are still ERC-20 tokens
  //     const internalLiquidityTokens = await getExternalTokensDetails(globalConstants.liquidityInternalTokens, provider);
  //     updatedLiquidityTokenPairs = updateTokenPairsWithNewInternalTokens(
  //       globalConstants.liquidityTokenPairs,
  //       internalLiquidityTokens
  //     );

  //     console.log("internalLiquidityTokens", internalLiquidityTokens);
  //     console.log("updatedLiquidityTokenPairs", updatedLiquidityTokenPairs);

  //     const liquidityTokenPairs: any = await getLiquidityPairsDetails(updatedLiquidityTokenPairs, provider);

  //     console.log("getLiquidityPairsDetails", liquidityTokenPairs);

  //     const availableExternalLiquidityTokens = updateExternalLiquidityTokensBasedOnTokenPairs(
  //       externalLiquidityTokens,
  //       liquidityTokenPairs
  //     );
  //     const availableInternalLiquidityTokens = updateInternalLiquidityTokensBasedOnTokenPairs(
  //       internalLiquidityTokens,
  //       liquidityTokenPairs
  //     );

  //     const updatedConstants = {
  //       ...globalConstants,
  //       internalAvailableTokens: updatedInternalTokens,
  //       externalAvailableTokens: updatedExternalTokens,
  //       tokenPairs: updatedTokenPairs,
  //       liquidityExternalTokens: availableExternalLiquidityTokens,
  //       liquidityInternalTokens: availableInternalLiquidityTokens,
  //       liquidityTokenPairs: liquidityTokenPairs,
  //     };

  //     dispatch(storeGlobalConstants(updatedConstants));

  //     console.log("updatedConstants after metamask data", updatedConstants);

  //     setGlobalConstants(updatedConstants);

  //     dispatch(storeErcInfo(JSON.stringify({ address: accounts[0], balance: wznnBalance })));

  //     if (isSyriusConnected) {
  //       setIsValidated(true);
  //     }

  //     setIsMetamaskConnected(true);
  //   } catch (err: any) {
  //     console.error(err);

  //     let readableError = err;
  //     if (err?.message) {
  //       readableError = err?.message;
  //     }
  //     readableError =
  //       readableError?.split(`"Error:`)?.pop()?.split(`"`)[0] ||
  //       readableError?.split(`'Error:`)?.pop()?.split(`'`)[0] ||
  //       "";

  //     toast(readableError + "", {
  //       position: "bottom-center",
  //       autoClose: 5000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: false,
  //       draggable: true,
  //       type: "error",
  //       theme: "dark",
  //     });
  //     return err;
  //   } finally {
  //     showSpinner(false);
  //   }
  // };

  // TODO: Extract this function in a separate file so it can be reused on the liquidity flow
  const getBalances = async (address: string) => {
    try {
      const addressObject = Primitives.Address.parse(address);

      const getAccountInfoByAddress = await zenon.ledger.getAccountInfoByAddress(addressObject);

      console.log("getAccountInfoByAddress", getAccountInfoByAddress);

      const plasma = await zenon.embedded.plasma.get(addressObject);

      getAccountInfoByAddress.plasma = plasma;

      return getAccountInfoByAddress;
    } catch (err: any) {
      console.error(err);
      let readableError = err;
      if (err?.message) {
        readableError = err?.message;
      }
      readableError = (readableError + "").split("Error: ")[(readableError + "").split("Error: ").length - 1];

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
      return {};
    }
  };

  const updateGlobalConstantsWithLiquidityInfo = async (zenon: any, constants: any, znnAddressObject: Address) => {
    const updatedConstants: any = {};
    Object.assign(updatedConstants, { ...constants });

    const getLiquidityInfo = await zenon.embedded.liquidity.getLiquidityInfo();
    console.log("getLiquidityInfo", getLiquidityInfo);

    const getAccountInfoByAddress: AccountInfo = await zenon.ledger.getAccountInfoByAddress(znnAddressObject);
    console.log("getAccountInfoByAddress", getAccountInfoByAddress);

    updatedConstants.liquidityTokenTuples = [];
    const updatedTuples = await Promise.all(
      getLiquidityInfo.tokenTuples.map(async (tup: any) => {
        const tokenInfo = await getZenonTokenInfo(tup.tokenStandard, zenon);
        console.log("tokenInfo", tokenInfo);

        return {
          ...JSONbig.parse(JSONbig.stringify(tup)),
          balance: (getAccountInfoByAddress.balanceInfoMap as any)?.[tup.tokenStandard]?.balance?.toString() || "0",
          balanceWithDecimals:
            (getAccountInfoByAddress.balanceInfoMap as any)?.[tup.tokenStandard]?.balanceWithDecimals?.toString() ||
            "0",
          symbol: tokenInfo?.symbol,
          decimals: tokenInfo?.decimals,
          name: tokenInfo?.name,
          address: tup.tokenStandard,
          isAvailable: true,
          icon: znnTokenIcon,
          network: updatedConstants.internalAvailableNetworks.find(
            (net: any) => net.name == "ZNN" || net.name == "Zenon"
          ),
          minAmount: ethers.BigNumber.from(tup?.minAmount).toString(),
          minAmountWithDecimals: ethers.utils.formatUnits(
            ethers.BigNumber.from(tup?.minAmount),
            ethers.BigNumber.from(tokenInfo?.decimals)
          ),
        };
      })
    );
    console.log("updatedTuples", updatedTuples);
    updatedConstants.liquidityTokenTuples.push(...updatedTuples);

    dispatch(storeGlobalConstants(updatedConstants));
    return updatedConstants;
  };

  // TODO: Extract this function in a separate file so it can be reused on the liquidity flow
  const updateGlobalConstantsWithBridgeInfo = async () => {
    // eslint-disable-next-line prefer-const
    let updatedConstants: any = {};
    Object.assign(updatedConstants, { ...globalConstants });

    const getBridgeInfo = await zenon.embedded.bridge.getBridgeInfo();
    console.log("getBridgeInfo", getBridgeInfo);

    if (getBridgeInfo.halted) {
      const showSpinner = handleSpinner(
        <>
          <div className="text-bold text-center mb-5 mt-4 warning p-3 small-border-radius">
            Bridge is currently unavailable! <br></br>Please try again later
          </div>
        </>,
        "extension-approval-spinner-root"
      );

      showSpinner(true);
      console.error("Bridge is halted!");
      throw Error("Bridge is currently unavailable!");
    }

    if (getBridgeInfo.allowKeyGen) {
      const showSpinner = handleSpinner(
        <>
          <div className="text-bold text-center mb-5 mt-4 warning p-3 small-border-radius">
            Bridge is currently performing KeyGen! <br></br>Please try again later
          </div>
        </>,
        "extension-approval-spinner-root"
      );

      showSpinner(true);
      console.error("Bridge is currently performing KeyGen!");
      throw Error("Bridge is currently performing KeyGen!");
    }

    const getOrchestratorInfo = await zenon.embedded.bridge.getOrchestratorInfo();
    console.log("getOrchestratorInfo", getOrchestratorInfo);
    updatedConstants.estimatedMomentumTimeInSeconds = getOrchestratorInfo.estimatedMomentumTime;

    const getAllNetworks = await zenon.embedded.bridge.getAllNetworks();
    console.log("getAllNetworks", getAllNetworks);
    console.log("JSON.stringify(getAllNetworks)", JSON.stringify(getAllNetworks));

    const getFrontierMomentum = await zenon.ledger.getFrontierMomentum();
    console.log("getFrontierMomentum", getFrontierMomentum);
    dispatch(storeMomentumHeight(getFrontierMomentum.height));

    // Subscribe to momentums
    (await zenon.subscribe.toMomentums()).onNotification((args: any) => {
      dispatch(storeMomentumHeight(args[0].height));
    });

    const disconnectHandler = (args: any) => {
      console.error("Disconnected from socket!", args);
      toast("Disconnected from node. Please check your internet connection and refresh the page", {
        position: "bottom-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
        toastId: "disconnected",
      });
    };

    zenon.wsClient?._wsRpc2Client.on("disconnect", disconnectHandler);
    zenon.wsClient?._wsRpc2Client.on("close", disconnectHandler);
    zenon.wsClient?._wsRpc2Client.on("error", disconnectHandler);

    let internalAvailableNetworks: simpleNetworkType[] = [];

    if (updatedConstants.isDevNet || updatedConstants.isTestNet) {
      internalAvailableNetworks = [
        {
          name: "Zenon",
          chainId: 3,
          icon: znnNetworkIcon,
          isAvailable: true,
          color: "#67E646",
        },
      ];
    } else {
      internalAvailableNetworks = [
        {
          name: "Zenon",
          chainId: 1,
          icon: znnNetworkIcon,
          isAvailable: true,
          color: "#67E646",
        },
      ];
    }

    // Default - mainNet
    let externalAvailableNetworks: simpleNetworkType[] = [
      {
        name: "BNB",
        chainId: 97,
        icon: bnbNetworkIcon,
        isAvailable: false,
        color: "#fcd535",
      },
      {
        name: "ETH",
        chainId: 1,
        icon: ethPurpleIcon,
        isAvailable: false,
        color: "#627EEA",
      },
    ];

    // If devNet
    if (updatedConstants.isDevNet) {
      externalAvailableNetworks = [
        {
          name: "BNB",
          chainId: 97,
          icon: bnbNetworkIcon,
          isAvailable: false,
          color: "#fcd535",
        },
        {
          name: "ETH-DEVNET",
          chainId: 31337,
          icon: ethPurpleIcon,
          isAvailable: false,
          color: "#627EEA",
        },
      ];
    }

    // If testnet
    if (updatedConstants.isTestNet) {
      externalAvailableNetworks = [
        {
          name: "BNB",
          chainId: 97,
          icon: bnbNetworkIcon,
          isAvailable: false,
          color: "#fcd535",
        },
        {
          name: "Sepolia",
          chainId: 11155111,
          icon: ethPurpleIcon,
          isAvailable: false,
          color: "#627EEA",
        },
      ];
    }

    // If supernova - mainNet
    if (updatedConstants?.isSupernovaMainNet) {
      externalAvailableNetworks = [
        {
          name: "Supernova",
          chainId: updatedConstants?.supernovaChainId,
          icon: supernovaNetworkIcon,
          isAvailable: false,
          color: "#F637A7",
        },
        {
          name: "ETH",
          chainId: 1,
          icon: ethPurpleIcon,
          isAvailable: false,
          color: "#627EEA",
        },
      ];
    }
    // If supernova testnet
    if (updatedConstants?.isSupernovaTestNet) {
      externalAvailableNetworks = [
        {
          name: "Supernova",
          chainId: updatedConstants?.supernovaChainId,
          icon: supernovaNetworkIcon,
          isAvailable: false,
          color: "#F637A7",
        },
        {
          name: "Sepolia",
          chainId: 11155111,
          icon: ethPurpleIcon,
          isAvailable: false,
          color: "#627EEA",
        },
      ];
    }

    let internalAvailableTokens: simpleTokenType[] = [
      {
        icon: znnTokenIcon,
        symbol: globalConstants.znnTokenInfo.symbol,
        name: "Zenon",
        address: globalConstants.znnTokenInfo.address,
        network: internalAvailableNetworks[0],
        balance: "0",
        decimals: globalConstants.znnTokenInfo.decimals,
        isAvailable: false,
        availableSoon: true,
        isCommonToken: true,
      },
      {
        icon: qsrTokenIcon,
        symbol: globalConstants.qsrTokenInfo.symbol,
        name: "Quasar",
        address: globalConstants.qsrTokenInfo.address,
        network: internalAvailableNetworks[0],
        balance: "0",
        decimals: globalConstants.qsrTokenInfo.decimals,
        isAvailable: false,
        availableSoon: true,
        isCommonToken: true,
      },
      {
        icon: znnTokenIcon,
        symbol: globalConstants.znnEthLpTokenInfo.symbol,
        name: "ZNN - ETH LP",
        address: globalConstants.znnEthLpTokenInfo.address,
        network: internalAvailableNetworks[0],
        balance: "0",
        decimals: globalConstants.znnEthLpTokenInfo.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: true,
      },
      {
        icon: qsrTokenIcon,
        symbol: globalConstants.qsrEthLpTokenInfo.symbol,
        name: "QSR - ETH LP",
        address: globalConstants.qsrEthLpTokenInfo.address,
        network: internalAvailableNetworks[0],
        balance: "0",
        decimals: globalConstants.qsrEthLpTokenInfo.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: true,
      },
    ];

    let externalAvailableTokens: simpleTokenType[] = [
      {
        icon: xZnnTokenIcon,
        symbol: globalConstants?.xZnnTokenInfo?.symbol,
        name: globalConstants?.xZnnTokenInfo?.name,
        //
        // TODO: update addresses in constants when changing between testNet and mainNet
        // Such that we have icons for the tokens
        // isAvailable: true if they are found on the network
        address: globalConstants?.xZnnTokenInfo?.address,
        // BSC network or Supernova network
        network: externalAvailableNetworks[0],
        balance: "0",
        decimals: globalConstants?.xZnnTokenInfo?.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: false,
      },
      // {
      //   icon: wznnTokenIcon,
      //   symbol: "wZNN",
      //   name: "Wrapped Zenon",
      //   //
      //   // TODO: update addresses in constants when changing between testNet and mainNet
      //   // Such that we have icons for the tokens
      //   // isAvailable: true if they are found on the network
      //   address: globalConstants.bscWznnTokenInfo.address,
      //   // BSC network
      //   network: externalAvailableNetworks[0],
      //   balance: "0",
      //   decimals: globalConstants.bscWznnTokenInfo.decimals,
      //   isAvailable: false,
      //   availableSoon: false,
      //   isCommonToken: false,
      // },
      // {
      //   icon: wqsrTokenIcon,
      //   symbol: "wQSR",
      //   name: "Wrapped Quasar",
      //   address: globalConstants.bscWqsrTokenInfo.address,
      //   // BSC network
      //   network: externalAvailableNetworks[0],
      //   balance: "0",
      //   decimals: globalConstants.bscWqsrTokenInfo.decimals,
      //   isAvailable: false,
      //   availableSoon: false,
      //   isCommonToken: true,
      // },
      {
        icon: wznnTokenIcon,
        symbol: "wZNN",
        name: "Wrapped Zenon",
        address: globalConstants.ethWznnTokenInfo.address,
        // ETH network
        network: externalAvailableNetworks[1],
        balance: "0",
        decimals: globalConstants.ethWznnTokenInfo.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: true,
      },
      {
        icon: wqsrTokenIcon,
        symbol: "wQSR",
        name: "Wrapped Quasar",
        address: globalConstants.ethWqsrTokenInfo.address,
        // ETH network
        network: externalAvailableNetworks[1],
        balance: "0",
        decimals: globalConstants.ethWqsrTokenInfo.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: true,
      },
    ];

    const liquidityNetworks: simpleNetworkType[] = [
      {
        name: globalConstants.defaultLiquidityExternalNetworkDetails.ETH.name,
        chainId: globalConstants.defaultLiquidityExternalNetworkDetails.ETH.chainId,
        icon: ethPurpleIcon,
        isAvailable: true,
        availableSoon: true,
        color: "#627EEA",
        contractAddress: globalConstants.defaultLiquidityExternalNetworkDetails.ETH.contractAddress,
      },
    ];

    const liquidityExternalNetworks: simpleNetworkType[] = liquidityNetworks;
    const liquidityInternalNetworks: simpleNetworkType[] = liquidityNetworks;

    const liquidityExternalTokens: simpleTokenType[] = [
      {
        icon: ethPurpleIcon,
        symbol: "WETH",
        name: "Wrapped ETH",
        address: globalConstants.defaultLiquidityPairsDetails.ETH.wethTokenAddress,
        // ETH
        network: liquidityExternalNetworks[0],
        balance: "0",
        decimals: 18,
        isAvailable: false,
        availableSoon: true,
        isCommonToken: false,
      },
      {
        icon: ethPurpleIcon,
        symbol: "ETH",
        name: "Ethereum",
        address: "",
        // ETH
        network: liquidityExternalNetworks[0],
        balance: "0",
        decimals: 18,
        // TODO: This needs to be manually made available or not.
        // Can't be updated with any RPC request
        isAvailable: true,
        availableSoon: true,
        isCommonToken: false,
      },
    ];

    const liquidityInternalTokens: simpleTokenType[] = [
      {
        icon: wznnTokenIcon,
        symbol: globalConstants.ethWznnTokenInfo.symbol,
        name: "Wrapped ZNN",
        address: globalConstants.ethWznnTokenInfo.address,
        // ETH
        network: liquidityInternalNetworks[0],
        balance: "0",
        decimals: globalConstants.ethWznnTokenInfo.decimals,
        isAvailable: false,
        availableSoon: false,
        isCommonToken: false,
      },
    ];

    console.log("EXT_CONNECT_CONSTANTS getAllNetworks", getAllNetworks);
    console.log("EXT_CONNECT_CONSTANTS externalAvailableNetworks", externalAvailableNetworks);
    getAllNetworks.list.forEach((network: any) => {
      let isNetworkLocallyDefined = false;
      externalAvailableNetworks = externalAvailableNetworks.map((extNetwork) => {
        if (extNetwork.chainId === network.chainId) {
          isNetworkLocallyDefined = true;
          extNetwork.name = (network.name + "").toUpperCase();
          extNetwork.contractAddress = network.contractAddress;
          extNetwork.networkClass = network.networkClass;
          extNetwork.isAvailable = true;
        }
        return extNetwork;
      });
      if (!isNetworkLocallyDefined) {
        externalAvailableNetworks.push({
          name: (network.name + "").toUpperCase(),
          chainId: network.chainId,
          icon: "",
          contractAddress: network.contractAddress,
          networkClass: network.networkClass,
          isAvailable: true,
        });
      }
    });
    console.log("externalAvailableNetworks", externalAvailableNetworks);
    // externalAvailableNetworks = curateExternalNetworksForSupernova(externalAvailableNetworks);
    // console.log("curatedExternalAvailableNetworks", externalAvailableNetworks);

    // const addPairChainIdToTokenList = (
    //   tokenList: simpleTokenType[],
    //   networkOfPairedToken: simpleNetworkType | undefined
    // ) => {
    //   const returnedList = tokenList.map((tok: any) => {
    //     console.log("addPairChainIdToTokenList");
    //     console.log("networkOfPairedToken", networkOfPairedToken);
    //     console.log("tokenList", tokenList);
    //     if (!networkOfPairedToken) return undefined;

    //     if (!tok?.chainIdsOfPairedTokens?.length) {
    //       tok.chainIdsOfPairedTokens = [networkOfPairedToken?.chainId || 0];
    //     } else {
    //       tok.chainIdsOfPairedTokens.push(networkOfPairedToken?.chainId || 0);
    //     }
    //     return tok;
    //   });
    //   return returnedList.filter((v) => v !== undefined);
    // };

    const addPairChainIdToTokenList = (
      tokenList: simpleTokenType[],
      originalTokenAddress: string,
      pairNetwork: number
    ) => {
      console.log("addPairChainIdToTokenList");
      console.log("tokenList", tokenList);
      console.log("JSON.stringify(tokenList)", JSON.stringify(tokenList));
      console.log("originalTokenAddress", originalTokenAddress);
      console.log("pairNetwork", pairNetwork);
      const returnedList = tokenList.map((tok: any) => {
        if (tok?.address?.toLowerCase() == originalTokenAddress?.toLowerCase()) {
          if (!tok?.chainIdsOfPairedTokens?.length) {
            tok.chainIdsOfPairedTokens = [pairNetwork];
          } else {
            tok.chainIdsOfPairedTokens.push(pairNetwork);
          }
        }
        return tok;
      });
      console.log("returnedList", returnedList);
      console.log("JSON.stringify(returnedList)", JSON.stringify(returnedList));
      return returnedList;
    };

    const mergeTokenToList = (
      tokenList: simpleTokenType[],
      networkList: simpleNetworkType[],
      tokenAddress: any,
      network: simpleNetworkType | undefined,
      // networkOfPairedToken: simpleNetworkType | undefined,
      isExternal = false
    ) => {
      let isTokenLocallyDefined = false;
      console.log("tokenList", tokenList);
      console.log("networkList", networkList);
      console.log("tokenAddress", tokenAddress);
      console.log("network", network);
      if (!network) return tokenList;

      const returnedList = tokenList.map((tok: any) => {
        // if (!tok?.chainIdsOfPairedTokens?.length) {
        //   tok.chainIdsOfPairedTokens = [networkOfPairedToken?.chainId || 0];
        // } else {
        //   tok.chainIdsOfPairedTokens.push(networkOfPairedToken?.chainId || 0);
        // }
        console.log("TOKTOK, tok", tok);
        if (tok.address.toLowerCase() == tokenAddress.toLowerCase() && tok.network?.chainId == network?.chainId) {
          isTokenLocallyDefined = true;
          tok.isAvailable = true;
          tok.network = networkList.find((net) => net?.chainId === network?.chainId);
        }
        return tok;
      });
      if (!isTokenLocallyDefined) {
        returnedList.push({
          address: tokenAddress,
          isAvailable: true,
          network: networkList.find((net) => net?.chainId === network?.chainId),
        });
      }

      // if (isExternal) {
      //   returnedList = curateExternalTokensForSupernova(returnedList);
      //   console.log("curatedReturnedList", returnedList);
      // } else {
      //   returnedList = curateInternalTokensForSupernova(returnedList);
      //   console.log("curatedReturnedList", returnedList);
      // }
      return returnedList;
    };

    //
    // Bridge (Swap)
    //
    console.log("internalAvailableTokens", JSON.stringify(internalAvailableTokens));
    console.log("externalAvailableTokens", JSON.stringify(externalAvailableTokens));

    updatedConstants.tokenPairs = [];
    getAllNetworks.list.forEach((network: any) => {
      network.tokenPairs.forEach((pair: any) => {
        internalAvailableTokens = mergeTokenToList(
          internalAvailableTokens,
          internalAvailableNetworks,
          pair.tokenStandard,
          // internalAvailableNetworks[0],
          internalAvailableNetworks.find((net) => net.chainId === network.chainId) || internalAvailableNetworks[0],
          false
        );
        externalAvailableTokens = mergeTokenToList(
          externalAvailableTokens,
          externalAvailableNetworks,
          pair.tokenAddress,
          externalAvailableNetworks.find((net) => net.chainId === network.chainId),
          true
        );

        console.log("first_externalAvailableTokens", JSON.stringify(externalAvailableTokens));

        const updatedPair = {
          ...pair,
          internalToken: internalAvailableTokens.find(
            (tok) => tok.address.toLowerCase() === pair.tokenStandard.toLowerCase()
          ),
          externalToken: externalAvailableTokens.find(
            (tok) =>
              tok.address.toLowerCase() === pair.tokenAddress.toLowerCase() && tok.network.chainId === network.chainId
          ),
          wrapFeePercentage: pair.feePercentage,
          unwrapRedeemDelay: pair.redeemDelay,
          minWrapAmount: ethers.BigNumber.from(pair.minAmount).toString(),
        };

        delete updatedPair.feePercentage;
        delete updatedPair.redeemDelay;
        delete updatedPair.tokenStandard;
        delete updatedPair.tokenAddress;
        delete updatedPair.minAmount;

        updatedConstants.tokenPairs.push(updatedPair);
      });
    });

    getAllNetworks.list.forEach((network: any) => {
      network.tokenPairs.forEach((pair: any) => {
        // internalAvailableTokens = addPairChainIdToTokenList(
        //   internalAvailableTokens,
        //   externalAvailableTokens.find((tok) => tok?.address?.toLowerCase() === pair.tokenAddress?.toLowerCase())
        //     ?.network
        // );
        // externalAvailableTokens = addPairChainIdToTokenList(
        //   externalAvailableTokens,
        //   internalAvailableTokens.find((tok) => tok?.address?.toLowerCase() === pair.tokenStandard?.toLowerCase())
        //     ?.network
        // );
        internalAvailableTokens = addPairChainIdToTokenList(
          internalAvailableTokens,
          pair.tokenStandard,
          externalAvailableTokens.find((tok) => tok?.address?.toLowerCase() === pair.tokenAddress?.toLowerCase())
            ?.network?.chainId || 0
        );
        externalAvailableTokens = addPairChainIdToTokenList(
          externalAvailableTokens,
          pair.tokenAddress,
          internalAvailableTokens.find((tok) => tok?.address?.toLowerCase() === pair.tokenStandard?.toLowerCase())
            ?.network?.chainId || 0
        );
      });
    });

    //
    // Liquidity
    //
    updatedConstants.liquidityTokenPairs = [
      {
        pairAddress: globalConstants.defaultLiquidityPairsDetails.ETH.pairAddress,
        routerContract: globalConstants.defaultLiquidityPairsDetails.ETH.routerContract,
        // [0] = ETH
        pairNetwork: liquidityNetworks[0],
        internalToken: liquidityInternalTokens[0],
        externalToken: liquidityExternalTokens[0],
      },
    ];

    updatedConstants.internalAvailableNetworks = [];
    updatedConstants.externalAvailableNetworks = [];
    updatedConstants.internalAvailableTokens = [];
    updatedConstants.externalAvailableTokens = [];

    updatedConstants.liquidityExternalNetworks = [];
    updatedConstants.liquidityInternalNetworks = [];
    updatedConstants.liquidityExternalTokens = [];
    updatedConstants.liquidityInternalTokens = [];

    updatedConstants.internalAvailableNetworks.push(...internalAvailableNetworks);
    updatedConstants.externalAvailableNetworks.push(...curateExternalNetworksForSupernova(externalAvailableNetworks));
    updatedConstants.internalAvailableTokens.push(...curateInternalTokensForSupernova(internalAvailableTokens));
    updatedConstants.externalAvailableTokens.push(...curateExternalTokensForSupernova(externalAvailableTokens));

    updatedConstants.liquidityExternalNetworks.push(...liquidityExternalNetworks);
    updatedConstants.liquidityInternalNetworks.push(...liquidityInternalNetworks);
    updatedConstants.liquidityExternalTokens.push(...liquidityExternalTokens);
    updatedConstants.liquidityInternalTokens.push(...liquidityInternalTokens);

    dispatch(storeGlobalConstants(updatedConstants));
    console.log("updatedConstants", updatedConstants);
    setGlobalConstants(updatedConstants);

    return updatedConstants;
  };

  const goNext = (where: string) => {
    onStepSubmit(where);
  };

  const checkForAffiliationCodeFromNode = async (zenon: Zenon) => {
    try {
      const extraData = await zenon.stats.getExtraData();
      console.log("extraData", extraData);
      console.log("extraData.affiliate.toString()", extraData.affiliate.toString());

      if (extraData.affiliate) {
        const referrerAddress = extraData.affiliate.toString();

        if (referrerAddress) {
          console.log("New referral code detected", referrerAddress);
          if (!getReferralAddress()) {
            console.log("Using: ", referrerAddress);
            try {
              if (Primitives.Address.parse(referrerAddress)) {
                dispatch(storeReferralCode(extraData.affiliate.toString()));
                toast(`Referral code applied. You will receive 1% bonus when unwrapping wZNN => ZNN and wQSR => QSR`, {
                  position: "bottom-center",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: false,
                  draggable: true,
                  type: "success",
                  theme: "dark",
                  toastId: "validReferralCode",
                });
              }
            } catch (err) {
              console.error("Invalid Referral Code");
              toast("Invalid Referral Code", {
                position: "bottom-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                type: "error",
                theme: "dark",
                toastId: "invalidReferralCode",
              });
            }
          } else {
            console.log("Detected existing referral code: ", getReferralAddress());
            console.log("Using the old(existing) one", getReferralAddress());
            dispatch(storeReferralCode(getReferralAddress()));
          }
        }
      } else {
        console.log("No referral code found on node");
      }
    } catch (err: any) {
      console.error(err);
      let readableError = err;
      if (err?.message) {
        readableError = err?.message;
      }
      readableError = (readableError + "").split("Error: ")[(readableError + "").split("Error: ").length - 1];
      console.error(readableError);

      toast("Invalid Referral Code", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        type: "error",
        theme: "dark",
        toastId: "invalidReferralCode",
      });

      return {};
    }
  };

  const clearInternalWallet = async () => {
    console.log("internalNetworkClient?.coreClient", internalNetworkClient?.coreClient);
    if (internalNetworkClient?.coreClient) {
      await internalNetworkClient.disconnect();
    } else {
      localStorage.removeItem("wc@2:core:0.3//pairing");
      localStorage.removeItem("wc@2:client:0.3//session");
      setHasParingsOrSessions(false);
    }
  };

  const clearExternalWallet = async () => {
    console.log("externalNetworkClient?.coreClient", externalNetworkClient?.coreClient);
    if (externalNetworkClient?.coreClient) {
      await externalNetworkClient.disconnect();
    } else {
      localStorage.removeItem("wc@2:core:0.3//pairing");
      localStorage.removeItem("wc@2:client:0.3//session");
      setHasParingsOrSessions(false);
    }
  };

  return (
    <div className="pl-3 pr-3 mt-4">
      {globalConstants?.isSupernovaNetwork ? (
        <></>
      ) : (
        <div className="d-flex justify-content-left align-items-center">
          <a
            className="no-decoration d-flex justify-content-start align-items-center text-sm"
            href="https://twitter.com/hashtag/HyperGrowth"
            target="_blank"
            rel="noreferrer">
            <img alt="fees-info" className="mr-1" src={infoIcon}></img>
            <div className="d-flex justify-items-center align-items-center">
              <div className="tooltip clickable-info text-bold pt-1 pb-1">
                {isReferralCodeApplied ? (
                  <>
                    {`Click here to see more referral links`}
                    <div className="tooltip-text background-clip-fix">
                      You successfully used a referral code to get 1% bonus cashback
                      <br></br>
                      for every unwrap from wZNN to ZNN and wQSR to QSR
                    </div>
                  </>
                ) : (
                  <>
                    {`Click here to find a referral link and get 1% bonus`}
                    <div className="tooltip-text background-clip-fix">
                      Use referral code to get 1% bonus cashback for
                      <br></br>
                      every unwrap from wZNN to ZNN and wQSR to QSR
                    </div>
                  </>
                )}
              </div>
              <img
                alt="step-logo"
                className="ml-1"
                style={{ maxWidth: "32px", maxHeight: "32px" }}
                src={twitterLogo}></img>
            </div>
          </a>

          <a
            className="no-decoration d-flex justify-content-start align-items-center text-sm"
            href="https://forum.zenon.org/t/perpetual-ecosystem-growth/1417/17"
            target="_blank"
            rel="noreferrer">
            <div className={`button secondary text-white ml-2 text-sm tooltip d-flex align-items-center`}>
              {/* <img alt="fees-info" className="mr-2" src={infoIcon}></img> */}
              About referral
              <span className="tooltip-text">Find out more about the referral program.</span>
            </div>
          </a>
        </div>
      )}

      <div className={`extension-item mb-5 mt-4`}>
        <div className={`step-counter ${isSyriusConnected && "completed"}`}>1</div>
        <div className="p-3">
          <div className="pl-4">
            <div className="step-content text-center p-0 mb-2">
              {isSyriusConnected ? (
                <div className="text-bold">
                  <span className="text-primary">{`Connected with ${internalNetworkClient.displayedProviderType} on `}</span>
                  <span className="tooltip">
                    <span className="text-white">{syriusAddress.slice(0, 3) + "..." + syriusAddress.slice(-3)}</span>
                    <span className="tooltip-text">{syriusAddress}</span>
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center">
                  {`Connect Zenon Wallet`}
                  <div className="tooltip" onClick={() => setIsSyriusExtensionEnabled((v) => !v)}>
                    <img
                      alt="step-logo"
                      className="ml-1"
                      style={{ maxWidth: "32px", maxHeight: "32px" }}
                      src={zenonLogo}></img>
                    <span className="tooltip-text">
                      {`Click here to ${
                        isSyriusExtensionEnabled ? "disable" : "enable"
                      } Syrius Extension connection method (advanced)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap w-100 justify-content-center align-items-center">
              {isSyriusExtensionEnabled ? (
                <>
                  <div
                    onClick={() => connectToInternalNetwork(internalNetworkProviderTypes.syriusExtension)}
                    className={`p-relative pr-3 pl-3 pt-1 pb-1 button d-flex align-items-center primary-on-hover ${
                      isSyriusConnected && internalNetworkClient.providerType ? "disabled" : ""
                    }
 ${
   isSyriusConnected && internalNetworkClient.providerType == internalNetworkProviderTypes.syriusExtension
     ? "primary soft-disabled"
     : "secondary"
 }`}>
                    <img
                      alt="step-logo"
                      className="mr-1"
                      style={{ maxWidth: "24px", maxHeight: "24px" }}
                      src={syriusLogo}></img>
                    <div>Extension</div>
                  </div>
                  <div className="">or</div>
                </>
              ) : (
                <></>
              )}
              <div
                onClick={() => connectToInternalNetwork(internalNetworkProviderTypes.walletConnect)}
                className={`p-relative pr-3 pl-3 pt-1 pb-1 button d-flex align-items-center primary-on-hover ${
                  isSyriusConnected && internalNetworkClient.providerType ? "disabled" : ""
                }
               ${
                 isSyriusConnected && internalNetworkClient.providerType == internalNetworkProviderTypes.walletConnect
                   ? "primary soft-disabled"
                   : "secondary"
               }`}>
                <img
                  alt="step-logo"
                  className="mr-1"
                  style={{ maxWidth: "24px", maxHeight: "24px" }}
                  src={walletConnectLogo}></img>
                <div>WalletConnect</div>
              </div>
            </div>
            {isSyriusConnected || hasParingsOrSessions ? (
              <div
                className="disconnect-button tooltip"
                onClick={() => {
                  clearInternalWallet();
                }}>
                <img src={closeIconRed} alt="disconnect"></img>
                <span className="tooltip-text">
                  {hasParingsOrSessions ? "Clear wallet pairing" : "Disconnect wallet"}
                </span>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      {/* ToDo: Put the isSyriusConnected ? "disabled" back */}
      <div className={`extension-item ${!isSyriusConnected ? "disabled" : ""} mb-5 mt-4`}>
        {/* <div className={`extension-item ${!isSyriusConnected ? "" : ""} mb-5 mt-4`}> */}
        <div className={`step-counter ${isMetamaskConnected && "completed"}`}>2</div>
        <div className="p-3">
          <div className="pl-4">
            <div className="step-content text-center p-0 mb-2">
              {isMetamaskConnected ? (
                <div className="text-bold">
                  <span className="text-primary">{`Connected with ${externalNetworkClient.displayedProviderType} on `}</span>
                  <span className="tooltip">
                    <span className="text-white">
                      {metamaskAddress.slice(0, 3) + "..." + metamaskAddress.slice(-3)}
                    </span>
                    <span className="tooltip-text">{metamaskAddress}</span>
                  </span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center">
                  {`Connect Ethereum Wallet`}
                  <img
                    alt="step-logo"
                    className="ml-1"
                    style={{ maxWidth: "32px", maxHeight: "32px" }}
                    src={ethLogo}></img>
                </div>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap w-100 justify-content-center align-items-center">
              <div
                onClick={() => connectToExternalNetwork(externalNetworkProviderTypes.metamask)}
                className={`p-relative pr-3 pl-3 pt-1 pb-1 button d-flex align-items-center primary-on-hover ${
                  isMetamaskConnected && externalNetworkClient.providerType ? "disabled" : ""
                }
               ${
                 isMetamaskConnected && externalNetworkClient.providerType == externalNetworkProviderTypes.metamask
                   ? "primary soft-disabled"
                   : "secondary"
               }`}>
                <img
                  alt="step-logo"
                  className="mr-1"
                  style={{ maxWidth: "24px", maxHeight: "24px" }}
                  src={metamaskLogo}></img>
                <div>Metamask</div>
              </div>
              <div className="">or</div>
              <div
                onClick={() => connectToExternalNetwork(externalNetworkProviderTypes.walletConnect)}
                className={`p-relative pr-3 pl-3 pt-1 pb-1 button d-flex align-items-center primary-on-hover ${
                  isMetamaskConnected && externalNetworkClient.providerType ? "disabled" : ""
                }
               ${
                 isMetamaskConnected && externalNetworkClient.providerType == externalNetworkProviderTypes.walletConnect
                   ? "primary soft-disabled"
                   : "secondary"
               }`}>
                <img
                  alt="step-logo"
                  className="mr-1"
                  style={{ maxWidth: "24px", maxHeight: "24px" }}
                  src={walletConnectLogo}></img>
                <div>WalletConnect</div>
              </div>
            </div>
            {isMetamaskConnected || hasParingsOrSessions ? (
              <div
                className="disconnect-button tooltip"
                onClick={() => {
                  clearExternalWallet();
                }}>
                <img src={closeIconRed} alt="disconnect"></img>
                <span className="tooltip-text">
                  {hasParingsOrSessions ? "Clear wallet pairing" : "Disconnect wallet"}
                </span>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      {globalConstants.isTestNet && (
        <div className="d-flex justify-content-start align-items-center mt-4 text-sm">
          <img alt="fees-info" className="mr-1" src={infoIcon}></img>
          <span className="">
            {"Metamask -> Settings -> Advanced -> Show test networks "}
            <br></br>
            {"-> Select Sepolia test network -> Get SepoliaETH from online Faucets"}
          </span>
        </div>
      )}

      {isLiquidityFlow ? (
        <div className={`extension-item-mt ${!isValidated ? "disabled" : ""} `}>
          <div className="step-content">
            <div className={`button primary text-white`} onClick={() => goNext("")}>
              Next
            </div>
          </div>
        </div>
      ) : (
        <div className={`extension-item ${!isValidated ? "disabled" : ""} `}>
          <div className={`step-counter ${isValidated && "completed"}`}>3</div>
          <div className="step-content pr-4">
            <div className="pr-5 pl-4">
              <div className={`button primary text-white`} onClick={() => goNext("new")}>
                New swap
              </div>
              <div className={`button mt-2 accent text-white`} onClick={() => goNext("existing")}>
                Existing swap
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtensionConnect;
