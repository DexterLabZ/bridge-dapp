import React, { FC, createContext, useEffect, useRef, useState } from "react";
import Client from "@walletconnect/sign-client";
import externalNetworkWalletConnectWrapper from "./externalNetworkWalletConnectWrapper";
import { SessionTypes, PairingTypes } from "@walletconnect/types";
import metamaskWrapper, { MetamaskChangeEventsHandler } from "./metamaskExtensionWrapper";
import { Primitives, Zenon } from "znn-ts-sdk";
import { AccountBlockTemplate } from "znn-ts-sdk/dist/lib/src/model/nom/account_block_template";
import { useDispatch, useSelector } from "react-redux";
import {
  resetInternalNetworkConnectionState,
  storeInternalNetworkChainIdentifier,
  storeInternalNetworkNodeUrl,
} from "../../redux/internalNetworkConnectionSlice";
import { toast } from "react-toastify";
import { resetErcInfo, resetZenonInfo, storeErcInfo, storeZenonInfo } from "../../redux/walletSlice";
import { extractAddressesFromNamespacesAccounts, getReferralAddress, getZenonWalletInfo } from "../../../utils/utils";
import { addBeforeUnloadEvents, removeBeforeUnloadEvents } from "../../pageHandlers/pageHandlers";
import { storeReferralCode } from "../../redux/referralSlice";
import { WalletConnectModal } from "@walletconnect/modal";
import { ethers } from "ethers-ts";
import { EthereumProvider } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider";
import {
  resetExternalNetworkConnectionState,
  storeExternalNetworkChainIdentifier,
  storeExternalNetworkNodeUrl,
} from "../../redux/externalNetworkConnectionSlice";
import metamaskExtensionWrapper from "./metamaskExtensionWrapper";
import {
  flowTypes,
  liquidityFlowSteps,
  storeCurrentWizardFlowStep,
  swapFlowSteps,
} from "../../redux/wizardStatusSlice";

export enum externalNetworkProviderTypes {
  "walletConnect" = "walletConnect",
  "metamask" = "metamask",
}

export const ExternalNetworkContext = createContext<any>(null);

export type syriusClientType = {
  zenon: Zenon;
  eventsHandler: any;
};

export type TransactionReceiptResponse = {
  hash: string;
  logIndex: number;
};

export type ExternalWalletInfo = {
  address: string;
  chainId: number;
  nodeUrl?: string;
};

export type anyProviderType = ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | EthereumProvider;

export const ExternalNetworkProvider: FC<{ children: any }> = ({ children }) => {
  const walletConnectClient = useRef<Client | null>(null);
  const wcModal = useRef<WalletConnectModal | null>(null);
  const syriusClient = useRef<syriusClientType | null>(null);
  const walletConnectSession = useRef<SessionTypes.Struct | null>(null);
  const walletConnectPairing = useRef<PairingTypes.Struct | null>(null);
  const metamaskEventHandlers = useRef<MetamaskChangeEventsHandler | null>(null);
  const [provider, setProvider] = useState<anyProviderType | null>(null);
  const [providerType, setProviderType] = useState<externalNetworkProviderTypes | null>(null);
  const [displayedProviderType, setDisplayedProviderType] = useState<string | null>(null);
  const maxRequestRetries = 3;
  const zenonSingleton = Zenon.getSingleton();
  const [globalConstants, setGlobalConstants] = useState(useSelector((state: any) => state.globalConstants));
  const wizardStatus = useSelector((state: any) => state.wizardStatus);
  const dispatch = useDispatch();
  const walletInfo = useSelector((state: any) => state.wallet);

  // Initialize the externalNetworkProvider when the component mounts
  useEffect(() => {
    return () => {
      // Clean up the externalNetworkProvider when the component unmounts
      if (providerType) {
        switch (providerType) {
          case externalNetworkProviderTypes.walletConnect: {
            if (walletConnectClient.current && walletConnectPairing.current) {
              externalNetworkWalletConnectWrapper.disconnectPairing(
                walletConnectClient.current,
                walletConnectPairing.current
              );
              walletConnectClient.current = null;
            }
            break;
          }
          case externalNetworkProviderTypes.metamask: {
            // ToDo: treat this case

            // if (syriusClient.current) {
            // zenonSingleton.clearSocketConnection();
            // syriusClient.current = null;
            // }
            break;
          }
          default: {
            console.error(`Unknown providerType: ${providerType}`);
          }
        }
      }
    };
  }, [providerType, zenonSingleton]);

  useEffect(() => {
    console.log("new providerType", providerType);
    setDisplayedProviderType(
      (providerType || "")
        // insert a space before all caps
        .replace(/([A-Z])/g, " $1")
        // uppercase the first character
        .replace(/^./, function (str) {
          return str.toUpperCase();
        })
    );
  }, [providerType]);

  const init = async (_providerType: externalNetworkProviderTypes) => {
    console.log("ExternalNetworkContext init, ", _providerType);
    if (!_providerType) throw Error("No provider type selected");
    setProviderType(_providerType);
    console.log("providerType", providerType);
  };

  const getProvider = async (_providerType?: externalNetworkProviderTypes, externalNetworkChainId?: number) => {
    if (!!providerType && !!provider) return provider;
    switch (_providerType) {
      case externalNetworkProviderTypes.walletConnect: {
        if (!walletConnectSession.current) throw Error("Session was not established");
        if (!externalNetworkChainId) throw Error("Please select network's chain ID");
        if (!!provider) return provider;
        const _provider = await externalNetworkWalletConnectWrapper.initProvider(externalNetworkChainId);
        setProvider(_provider);
        dispatch(storeExternalNetworkNodeUrl((_provider as ethers.providers.JsonRpcProvider)?.connection?.url));
        console.log("Initialized new JsonRpcProvider", _provider);
        return _provider;
      }
      case externalNetworkProviderTypes.metamask: {
        if (!!provider) return provider;
        const _provider = metamaskWrapper.getProvider();
        setProvider(_provider);
        console.log("Initialized new metamask provider", _provider);
        return _provider;
      }
      default: {
        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const connect = async (
    _providerType: externalNetworkProviderTypes,
    onDismiss?: (reason: string) => unknown
  ): Promise<Partial<ExternalWalletInfo>> => {
    if (_providerType) {
      setProviderType(_providerType);
    } else {
      if (providerType) {
        _providerType = providerType;
      } else {
        throw Error("No provider type selected");
      }
    }

    switch (_providerType) {
      case externalNetworkProviderTypes.walletConnect: {
        const walletClient = walletConnectClient.current || (await externalNetworkWalletConnectWrapper.initClient());
        walletConnectClient.current = walletClient;

        // const wcModalInstance = wcModal.current || (await externalNetworkWalletConnectWrapper.initModal());
        // wcModal.current = wcModalInstance;

        // Because externalNetworkWalletConnectWrapper.connect triggers an window.open - we dont want to
        // keep the beforeUnload event that asks the user if he wants to leave the page.
        removeBeforeUnloadEvents();
        const { session, pairing } = await externalNetworkWalletConnectWrapper.connect(
          walletClient,
          // wcModalInstance,
          onDismiss
        );
        addBeforeUnloadEvents();

        walletConnectSession.current = session;
        walletConnectPairing.current = pairing;

        console.log("success session", session);
        console.log("success pairing", pairing);

        const connectionInfo: Partial<ExternalWalletInfo> = {
          address: session?.namespaces?.eip155?.accounts?.[0]?.split(":")?.[2] || "",
          chainId: Number(session?.namespaces?.eip155?.chains?.[0]?.split(":")?.[1] || ""),
        };
        const provider = await getProvider(_providerType, connectionInfo.chainId);

        externalNetworkWalletConnectWrapper.registerEvents(
          walletClient,
          provider as ethers.providers.JsonRpcProvider,
          () => {
            console.log("disconnect", externalNetworkProviderTypes.walletConnect);
            return disconnect(externalNetworkProviderTypes.walletConnect);
          },
          onAddressChange,
          onChainIdChange,
          onAccountsChange
        );
        return connectionInfo;
      }
      case externalNetworkProviderTypes.metamask: {
        // ToDo: Treat this case

        // syriusClient.current = {
        //   zenon: zenonSingleton,
        //   eventsHandler: metamaskWrapper.registerEvents(onAddressChange, onChainIdChange),
        // };
        const connectionInfo = await metamaskWrapper.getConnectionInfo();
        const provider = await getProvider(_providerType, connectionInfo.chainId);

        metamaskEventHandlers.current = metamaskWrapper.registerEvents(
          provider as ethers.providers.Web3Provider,
          () => {
            console.log("disconnect", externalNetworkProviderTypes.metamask);
            return disconnect(externalNetworkProviderTypes.metamask);
          },
          onAddressChange,
          onChainIdChange
        );

        // const connectionInfo: Partial<ExternalWalletInfo> = {
        //   address: session?.namespaces?.eip155?.chains?.[0]?.split(":")?.[0] || "",
        //   chainId: Number(session?.namespaces?.eip155?.chains?.[0]?.split(":")?.[1] || ""),
        // };
        return connectionInfo;
      }
      default: {
        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const goToExtensionConnectStep = () => {
    // Because this event is registered after Meta flow is set
    // We can't know if the user connected for a liquidity flow
    // and then disconnected and changed for a swap flow
    // Problem: Next time it will be disconnected
    // it will redirect to the wrong meta flow
    console.log("wizardStatus.currentFlowType", wizardStatus.currentFlowType);
    console.log("wizardStatus.currentFlowStep", wizardStatus.currentFlowStep);
    if (wizardStatus.currentFlowType == flowTypes.LiquidityStaking) {
      dispatch(storeCurrentWizardFlowStep(liquidityFlowSteps?.["ExtensionConnect"]));
    } else {
      // Swap flow
      dispatch(storeCurrentWizardFlowStep(swapFlowSteps?.["ExtensionConnect"]));
    }

    // dispatch(storeCurrentWizardFlowStep(swapFlowSteps?.["ExtensionConnect"]));
  };

  const disconnect = async (_providerType: externalNetworkProviderTypes): Promise<boolean> => {
    if (_providerType) {
      setProviderType(_providerType);
    } else {
      if (providerType) {
        _providerType = providerType;
      } else {
        throw Error("No provider type selected");
      }
    }
    console.log("disconnect _providerType", _providerType);

    toast(`Disconnected from wallet !`, {
      position: "bottom-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      type: "error",
      theme: "dark",
    });

    switch (_providerType) {
      case externalNetworkProviderTypes.walletConnect: {
        if (walletConnectClient.current) {
          if (walletConnectPairing.current) {
            await externalNetworkWalletConnectWrapper.disconnectPairing(
              walletConnectClient.current,
              walletConnectPairing.current
            );
          } else {
            await externalNetworkWalletConnectWrapper.disconnectAllPairings(walletConnectClient.current);
          }

          if (walletConnectSession.current) {
            await externalNetworkWalletConnectWrapper.disconnectSession(
              walletConnectClient.current,
              walletConnectSession.current
            );
          } else {
            await externalNetworkWalletConnectWrapper.disconnectAllSessions(walletConnectClient.current);
          }

          walletConnectPairing.current = null;
          walletConnectSession.current = null;
          walletConnectClient.current = null;
          setProviderType(null);
          setProvider(null);

          goToExtensionConnectStep();

          dispatch(resetErcInfo());
          dispatch(resetExternalNetworkConnectionState());
        }
        return true;
      }
      case externalNetworkProviderTypes.metamask: {
        if (metamaskEventHandlers.current) {
          metamaskWrapper.unregisterEvents(metamaskEventHandlers.current);
          metamaskEventHandlers.current = null;
        }
        setProviderType(null);
        setProvider(null);

        goToExtensionConnectStep();

        dispatch(resetErcInfo());
        dispatch(resetExternalNetworkConnectionState());
        return true;
      }
      default: {
        walletConnectClient.current = null;
        walletConnectSession.current = null;
        walletConnectPairing.current = null;
        setProviderType(null);
        setProvider(null);

        goToExtensionConnectStep();

        dispatch(resetErcInfo());
        dispatch(resetExternalNetworkConnectionState());

        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const connectToNode = async (nodeUrl: string): Promise<void> => {
    // zenonSingleton.clearSocketConnection();
    // return zenonSingleton.initialize(nodeUrl, false, 2500);
    // dispatch(storeExternalNetworkNodeUrl(nodeUrl));
  };

  const getWalletInfo = async (
    _provider: anyProviderType | null = provider,
    _providerType: externalNetworkProviderTypes | null = providerType,
    maxRetries: number = maxRequestRetries
  ): Promise<ExternalWalletInfo> => {
    try {
      console.log("getWalletInfo - Provider", provider);
      console.log("getWalletInfo - ProviderType", providerType);

      if (!_providerType) throw Error("No provider type selected");
      if (!_provider) throw Error("No provider initialized");
      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          // Because externalNetworkWalletConnectWrapper.connect triggers an window.open - we don't want to
          // keep the beforeUnload event that asks the user if he wants to leave the page.
          removeBeforeUnloadEvents();
          console.log("getWalletInfo - provider", _provider);
          const currentAccount = externalNetworkWalletConnectWrapper
            .getCurrentAccount(walletConnectSession.current)
            ?.toLowerCase();
          const currentChainId = externalNetworkWalletConnectWrapper.getCurrentChainId(walletConnectSession.current);
          // const balance = await externalNetworkWalletConnectWrapper.getBalance(
          //   _provider as ethers.providers.JsonRpcProvider,
          //   currentAccount,
          //   currentChainId?.toString()
          // );
          addBeforeUnloadEvents();
          // console.log("Balance", balance);

          // dispatch(storeInternalNetworkNodeUrl(info.nodeUrl));
          // dispatch(storeInternalNetworkChainIdentifier(info.chainId));
          const walletInfo: ExternalWalletInfo = {
            address: currentAccount,
            chainId: currentChainId,
            nodeUrl: (_provider as ethers.providers.JsonRpcProvider)?.connection?.url,
          };
          console.log("walletInfo", walletInfo);

          dispatch(storeExternalNetworkChainIdentifier(walletInfo.chainId));
          dispatch(storeExternalNetworkNodeUrl(walletInfo.nodeUrl));
          return walletInfo;
        }
        case externalNetworkProviderTypes.metamask: {
          // if (!syriusClient.current) throw Error("Client was not initialized");
          console.log("getWalletInfo - _provider", _provider);

          const currentAccount = (
            await metamaskWrapper.getCurrentAccount(_provider as ethers.providers.Web3Provider)
          )?.toLowerCase();
          const currentChainId = await metamaskWrapper.getCurrentChainId(_provider as ethers.providers.Web3Provider);
          // const balance = await metamaskWrapper.getBalance(_provider as ethers.providers.Web3Provider, currentAccount);
          // console.log("Balance", balance);

          const walletInfo: ExternalWalletInfo = {
            address: currentAccount,
            chainId: currentChainId,
            // Metamask doesn't disclose the node url it's using
            nodeUrl: "",
          };
          console.log("walletInfo", walletInfo);
          dispatch(storeExternalNetworkChainIdentifier(walletInfo.chainId));
          dispatch(storeExternalNetworkNodeUrl(walletInfo.nodeUrl));

          // info.nodeUrl = ifNeedReplaceNodeWithDefaultAndNotifyUser(info.nodeUrl);
          // dispatch(storeInternalNetworkNodeUrl(info.nodeUrl));
          // dispatch(storeInternalNetworkChainIdentifier(info.chainId));
          return walletInfo;
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("getInfo error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await getWalletInfo(_provider, _providerType, maxRetries - 1);
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    }
  };

  // ToDo: reorder parameters so that getBalance for eth doesn't need to be called with (null, null, provider)
  const getBalance = async (
    tokenAddress?: string,
    tokenAbi?: string,
    isNativeCoin = false,
    _provider: anyProviderType | null = provider,
    _providerType: externalNetworkProviderTypes | null = providerType,
    maxRetries: number = maxRequestRetries
  ): Promise<ethers.BigNumber> => {
    try {
      const walletInfo = await getWalletInfo(_provider, _providerType, maxRetries);
      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          const balance = await externalNetworkWalletConnectWrapper.getBalance(
            _provider as ethers.providers.JsonRpcProvider,
            walletInfo.address,
            tokenAddress,
            tokenAbi,
            isNativeCoin
          );
          console.log("balance", balance);
          return balance;
        }
        case externalNetworkProviderTypes.metamask: {
          const balance = await metamaskWrapper.getBalance(
            _provider as ethers.providers.Web3Provider,
            walletInfo.address,
            tokenAddress,
            tokenAbi,
            isNativeCoin
          );
          console.log("Balance", balance);

          return balance;
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("getInfo error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await getBalance(tokenAddress, tokenAbi, isNativeCoin, _provider, _providerType, maxRetries - 1);
        } else
          throw Error(`Unable to make request after ,${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    }
  };

  const estimateGas = async (
    contractAddress: string,
    abi: string,
    functionName: string,
    params: any[],
    transactionValue?: ethers.BigNumber,
    transactionGasLimit?: ethers.BigNumber,
    _providerType: externalNetworkProviderTypes | null = providerType,
    _provider: anyProviderType | null = provider,
    maxRetries: number = maxRequestRetries
  ): Promise<ethers.BigNumber> => {
    try {
      removeBeforeUnloadEvents();
      if (!_providerType) throw Error("No provider type selected");
      console.log("externalNetworkContext - sendTransaction - params", params);
      if (!_provider) throw Error("No provider initialized");

      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          if (!walletConnectPairing.current) throw Error("Pairing was not established");
          console.log("externalNetworkContext - sending - session", walletConnectSession.current);
          console.log("externalNetworkContext - sending - pairing", walletConnectPairing.current);

          const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
          const currentUserAddress = ercInfo?.address;

          const walletName = walletConnectSession.current?.peer?.metadata?.name;
          toast(`Transaction sent to your wallet. Please check ${walletName} app`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });

          return await externalNetworkWalletConnectWrapper.estimateGas(
            _provider,
            contractAddress,
            abi,
            functionName,
            walletConnectClient.current,
            walletConnectSession.current,
            walletConnectPairing.current,
            params,
            currentUserAddress,
            transactionValue,
            transactionGasLimit
          );
        }
        case externalNetworkProviderTypes.metamask: {
          toast(`Transaction sent to your wallet. Please check MetaMask Extension`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });
          const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
          const currentUserAddress = ercInfo?.address;

          const response = await metamaskWrapper.estimateGas(
            _provider,
            contractAddress,
            abi,
            functionName,
            params,
            currentUserAddress,
            transactionValue,
            transactionGasLimit
          );
          return response;
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("sendTransaction error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await estimateGas(
            contractAddress,
            abi,
            functionName,
            params,
            transactionValue,
            transactionGasLimit,
            _providerType,
            _provider,
            maxRetries - 1
          );
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    } finally {
      addBeforeUnloadEvents();
    }
  };

  const callContract = async (
    contractAddress: string,
    abi: string,
    functionName: string,
    params: any[],
    transactionValue?: ethers.BigNumber,
    transactionGasLimit?: ethers.BigNumber,
    _providerType: externalNetworkProviderTypes | null = providerType,
    _provider: anyProviderType | null = provider,
    maxRetries: number = maxRequestRetries
  ): Promise<TransactionReceiptResponse> => {
    try {
      removeBeforeUnloadEvents();
      if (!_providerType) throw Error("No provider type selected");
      console.log("externalNetworkContext - sendTransaction - params", params);
      if (!_provider) throw Error("No provider initialized");

      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          if (!walletConnectPairing.current) throw Error("Pairing was not established");
          console.log("externalNetworkContext - sending - session", walletConnectSession.current);
          console.log("externalNetworkContext - sending - pairing", walletConnectPairing.current);

          const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
          const currentUserAddress = ercInfo?.address;

          const walletName = walletConnectSession.current?.peer?.metadata?.name;
          toast(`Transaction sent to your wallet. Please check ${walletName} app`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });

          return await externalNetworkWalletConnectWrapper.callContract(
            _provider,
            contractAddress,
            abi,
            functionName,
            walletConnectClient.current,
            walletConnectSession.current,
            walletConnectPairing.current,
            params,
            currentUserAddress,
            transactionValue,
            transactionGasLimit
          );
        }
        case externalNetworkProviderTypes.metamask: {
          toast(`Transaction sent to your wallet. Please check MetaMask Extension`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });
          const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
          const currentUserAddress = ercInfo?.address;

          const response = await metamaskWrapper.callContract(
            _provider,
            contractAddress,
            abi,
            functionName,
            params,
            currentUserAddress,
            transactionValue,
            transactionGasLimit
          );
          return response;
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("sendTransaction error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await callContract(
            contractAddress,
            abi,
            functionName,
            params,
            transactionValue,
            transactionGasLimit,
            _providerType,
            _provider,
            maxRetries - 1
          );
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    } finally {
      addBeforeUnloadEvents();
    }
  };

  const sendTransaction = async (
    params: {
      fromAddress: any;
      transaction: any;
    },
    _providerType: externalNetworkProviderTypes | null = providerType,
    maxRetries: number = maxRequestRetries
  ): Promise<any> => {
    if (!_providerType) throw Error("No provider type selected");
    console.log("externalNetworkContext - sendTransaction - params", params);

    try {
      removeBeforeUnloadEvents();
      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          // const signature = await externalNetworkWalletConnectWrapper.signTransaction(
          //   walletConnectClient.current,
          //   walletConnectSession.current,
          //   params
          // );
          // console.log("signature", signature);
          // params.accountBlock.signature = signature;
          // console.log("signedAccountBlock", params.accountBlock);

          console.log("externalNetworkContext - sending - session", walletConnectSession.current);
          console.log("externalNetworkContext - sending - pairing", walletConnectPairing?.["current"]);

          // return await externalNetworkWalletConnectWrapper.sendTransaction(
          //   walletConnectClient.current,
          //   walletConnectSession.current,
          //   params
          // );

          // await walletConnectClient.current.disconnect({
          //   topic: walletConnectPairing?.current?.topic || "",
          //   reason: {
          //     code: 0,
          //     message: "error.message" || "Socket error",
          //     data: "error.message" || "Socket error",
          //   },
          // });

          // Because externalNetworkWalletConnectWrapper.connect triggers an window.open - we dont want to
          // Keep the beforeUnload event that asks the user if he wants to leave the page.
          return await externalNetworkWalletConnectWrapper.sendTransaction(
            walletConnectClient.current,
            walletConnectSession.current,
            params
          );
        }
        case externalNetworkProviderTypes.metamask: {
          return await metamaskWrapper.sendTransaction(params.transaction);
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("sendTransaction error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await sendTransaction(params, _providerType, maxRetries - 1);
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    } finally {
      addBeforeUnloadEvents();
    }
  };

  const requestNetworkSwitch = async (
    newChainId: number,
    _providerType: externalNetworkProviderTypes | null = providerType,
    _provider: anyProviderType | null = provider,
    maxRetries: number = maxRequestRetries
  ): Promise<any> => {
    try {
      removeBeforeUnloadEvents();
      if (!_providerType) throw Error("No provider type selected");
      if (!_provider) throw Error("No provider initialized");

      switch (_providerType) {
        case externalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          if (!walletConnectPairing.current) throw Error("Pairing was not established");
          console.log("externalNetworkContext - sending - session", walletConnectSession.current);
          console.log("externalNetworkContext - sending - pairing", walletConnectPairing.current);

          const walletName = walletConnectSession.current?.peer?.metadata?.name;
          toast(`Transaction sent to your wallet. Please check ${walletName} app`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });

          return await externalNetworkWalletConnectWrapper.requestNetworkSwitch(
            _provider,
            newChainId,
            walletConnectClient.current,
            walletConnectSession.current
          );
        }
        case externalNetworkProviderTypes.metamask: {
          toast(`Transaction sent to your wallet. Please check MetaMask Extension`, {
            position: "bottom-center",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "info",
            theme: "dark",
          });

          const response = await metamaskWrapper.requestNetworkSwitch(newChainId);
          return response;
        }
        default: {
          throw Error(`Unknown providerType: ${_providerType}`);
        }
      }
    } catch (err: any) {
      console.error("sendTransaction error", err);
      const handledError = await handleError(err);
      if (handledError.shouldRetry) {
        console.log("Retrying request");
        // Retry
        if (maxRetries > 0) {
          return await requestNetworkSwitch(newChainId, _providerType, _provider, maxRetries);
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries. Error: ${handledError.message}`);
      } else throw Error(`Error: ${handledError.message}`);
    } finally {
      addBeforeUnloadEvents();
    }
  };

  const handleError = async (error: any) => {
    const handledError = {
      shouldRetry: false,
      message: "",
    };
    try {
      console.warn("error.message", error.message);
      handledError.message = error.message;

      if (error?.code == -32602 && error?.message?.toLowerCase()?.includes(`Bad state: No element`.toLowerCase())) {
        // error.message = 'Bad state: No element';
        if (!walletConnectClient.current) {
          handledError.message = "Client was not initialized!";
          throw Error(handledError.message);
        }
        if (!walletConnectSession.current) {
          handledError.message = "Session was not established!";
          throw Error(handledError.message);
        }
        if (!walletConnectPairing.current) {
          handledError.message = "Pairing was not established!";
          throw Error(handledError.message);
        }

        // Disconnect current pair and reconnect with new pair
        await walletConnectClient.current.disconnect({
          topic: walletConnectPairing.current.topic,
          reason: {
            code: error?.code,
            message: error?.message || "Socket error",
            data: error?.message || "Socket error",
          },
        });
        console.log("Reconnecting...");
        const { session, pairing } = await externalNetworkWalletConnectWrapper.connect(
          walletConnectClient.current
          // wcModal.current as WalletConnectModal
        );
        walletConnectSession.current = session;
        walletConnectPairing.current = pairing;
        handledError.shouldRetry = true;
      }

      if (error.code == 9000 && error.message?.toLowerCase()?.includes(`Wallet is locked`.toLowerCase())) {
        handledError.shouldRetry = false;
        handledError.message = "Your wallet is locked. Please unlock!";
        throw Error(handledError.message);
      }

      if (error.code == -32602 && error.message?.toLowerCase()?.includes(`No matching key`.toLowerCase())) {
        if (!walletConnectClient.current) {
          handledError.message = "Client was not initialized!";
          throw Error(handledError.message);
        }
        if (!walletConnectSession.current) {
          handledError.message = "Session was not established!";
          throw Error(handledError.message);
        }
        if (!walletConnectPairing.current) {
          handledError.message = "Pairing was not established!";
          throw Error(handledError.message);
        }

        console.log("Retrying...");
        handledError.shouldRetry = true;
      }

      if (
        error?.code == -32602 &&
        error?.message
          ?.toLowerCase()
          ?.includes(`type 'Null' is not a subtype of type 'Map<String, dynamic>'`.toLowerCase())
      ) {
        // Do what now?
        // if (!walletConnectClient.current) throw Error("Client was not initialized");
        // if (!walletConnectSession.current) throw Error("Session was not established");
        // if (!walletConnectPairing.current) throw Error("Pairing was not established");
        // // Disconnect current pair and reconnect with new pair
        // await walletConnectClient.current.disconnect({
        //   topic: walletConnectPairing.current.topic,
        //   reason: {
        //     code: error?.code,
        //     message: error?.message || "Socket error",
        //     data: error?.message || "Socket error",
        //   },
        // });
        // console.log("Reconnecting...");
        // const {session, pairing} = await connectConnect(walletConnectClient.current);
        // walletConnectSession.current = session;
        // walletConnectPairing.current = pairing;
        // handledError.shouldRetry = true;
      }
    } catch (err) {
      console.error("Error handling error", err);
      handledError.message = "Unknown error!";
    } finally {
      return handledError;
    }
  };

  const onAccountsChange = async (
    newAccounts: string[],
    _provider: anyProviderType,
    _providerType: externalNetworkProviderTypes
  ) => {
    console.log("onAccountsChange - provider", provider);
    if (walletConnectSession?.current?.namespaces?.eip155?.accounts) {
      walletConnectSession.current.namespaces.eip155.accounts = newAccounts;
    }
    // const currentAccountAddress = extractAddressesFromNamespacesAccounts(newAccounts)[0];
    // const newErcInfo = await externalNetworkWalletConnectWrapper.getBalance(currentAccountAddress);
    const walletInfo = await getWalletInfo(_provider, _providerType);
    console.log("getWalletInfo", walletInfo);
    dispatch(storeErcInfo(JSON.stringify(walletInfo)));
  };

  const onAddressChange = async (
    newAddress: string,
    _provider: anyProviderType,
    _providerType: externalNetworkProviderTypes
  ) => {
    console.log("__addressChanged to", newAddress);
    // const getAccountInfoByAddress = await zenonSingleton.ledger.getAccountInfoByAddress(addressObject);
    // console.log("getAccountInfoByAddress", getAccountInfoByAddress);

    // ToDo: Update balances and address
    //
    const walletInfo = await getWalletInfo(_provider, _providerType);
    console.log("getWalletInfo", walletInfo);
    dispatch(storeErcInfo(JSON.stringify(walletInfo)));
  };

  const onChainIdChange = async (
    newChainId: string,
    _provider: anyProviderType,
    _providerType: externalNetworkProviderTypes
  ) => {
    console.log("__chainIdChanged to", newChainId);

    const newProvider = await getProvider(_providerType, Number(newChainId));
    const walletInfo = await getWalletInfo(newProvider, _providerType);
    console.log("getWalletInfo", walletInfo);
    dispatch(storeErcInfo(JSON.stringify(walletInfo)));
    dispatch(storeExternalNetworkChainIdentifier(newChainId));
  };

  const externalNetworkProvider = {
    coreClient: providerType == externalNetworkProviderTypes.walletConnect ? walletConnectClient.current : provider,
    providerType: providerType,
    displayedProviderType: displayedProviderType,
    init: init,
    getProvider: getProvider,
    disconnect: disconnect,
    connect: connect,
    connectToNode: connectToNode,
    getWalletInfo: getWalletInfo,
    getBalance: getBalance,
    sendTransaction: sendTransaction,
    callContract: callContract,
    estimateGas: estimateGas,
    requestNetworkSwitch: requestNetworkSwitch,
  };

  return <ExternalNetworkContext.Provider value={externalNetworkProvider}>{children}</ExternalNetworkContext.Provider>;
};
