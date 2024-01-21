import React, { FC, createContext, useEffect, useRef, useState } from "react";
import Client from "@walletconnect/sign-client";
import externalNetworkWalletConnectWrapper from "./externalNetworkWalletConnectWrapper";
import { SessionTypes, PairingTypes } from "@walletconnect/types";
import metamaskWrapper, { MetamaskChangeEventsHandler } from "./metamaskExtensionWrapper";
import { Primitives, Zenon } from "znn-ts-sdk";
import { AccountBlockTemplate } from "znn-ts-sdk/dist/lib/src/model/nom/account_block_template";
import { useDispatch, useSelector } from "react-redux";
import { resetConnectionState, storeChainIdentifier, storeNodeUrl } from "../../redux/connectionSlice";
import { toast } from "react-toastify";
import { resetZenonInfo, storeErcInfo, storeZenonInfo } from "../../redux/walletSlice";
import { extractAddressesFromNamespacesAccounts, getReferralAddress, getZenonWalletInfo } from "../../../utils/utils";
import { addBeforeUnloadEvents, removeBeforeUnloadEvents } from "../../pageHandlers/pageHandlers";
import { storeReferralCode } from "../../redux/referralSlice";
import { WalletConnectModal } from "@walletconnect/modal";
import { ethers } from "ethers-ts";
import { EthereumProvider } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider";

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

        metamaskEventHandlers.current = metamaskWrapper.registerEvents(
          provider as ethers.providers.Web3Provider,
          onAddressChange,
          onChainIdChange
        );

        const connectionInfo = await metamaskWrapper.getConnectionInfo();

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

    switch (_providerType) {
      case externalNetworkProviderTypes.walletConnect: {
        if (walletConnectClient.current) {
          externalNetworkWalletConnectWrapper.disconnectAllPairings(walletConnectClient.current);
          externalNetworkWalletConnectWrapper.disconnectAllSessions(walletConnectClient.current);
          walletConnectSession.current = null;
          walletConnectPairing.current = null;

          walletConnectClient.current = null;
          setProviderType(null);

          dispatch(resetZenonInfo());
          dispatch(resetConnectionState());
        }
        return true;
      }
      case externalNetworkProviderTypes.metamask: {
        // ToDo: Treat this case

        if (metamaskEventHandlers.current) {
          metamaskWrapper.unregisterEvents(metamaskEventHandlers.current);
          metamaskEventHandlers.current = null;
        }
        setProviderType(null);

        // dispatch(resetZenonInfo());
        // dispatch(resetConnectionState());

        return true;
      }
      default: {
        // ToDo: treat this case

        syriusClient.current = null;
        walletConnectClient.current = null;
        walletConnectSession.current = null;
        walletConnectPairing.current = null;

        dispatch(resetZenonInfo());
        dispatch(resetConnectionState());

        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const connectToNode = async (nodeUrl: string): Promise<void> => {
    // zenonSingleton.clearSocketConnection();
    // return zenonSingleton.initialize(nodeUrl, false, 2500);
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

          // dispatch(storeNodeUrl(info.nodeUrl));
          // dispatch(storeChainIdentifier(info.chainId));
          const walletInfo: ExternalWalletInfo = {
            address: currentAccount,
            chainId: currentChainId,
            nodeUrl: (_provider as ethers.providers.JsonRpcProvider)?.connection?.url,
          };
          console.log("walletInfo", walletInfo);
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
            nodeUrl: (_provider as ethers.providers.JsonRpcProvider)?.connection?.url,
          };
          console.log("walletInfo", walletInfo);

          // info.nodeUrl = ifNeedReplaceNodeWithDefaultAndNotifyUser(info.nodeUrl);
          // dispatch(storeNodeUrl(info.nodeUrl));
          // dispatch(storeChainIdentifier(info.chainId));
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
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries.`);
      } else throw Error(`Unable to make request and couldn't retry.`);
    }
  };

  const getBalance = async (
    tokenAddress?: string,
    tokenAbi?: string,
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
            tokenAbi
          );
          console.log("balance", balance);
          return balance;
        }
        case externalNetworkProviderTypes.metamask: {
          const balance = await metamaskWrapper.getBalance(
            _provider as ethers.providers.Web3Provider,
            walletInfo.address,
            tokenAddress,
            tokenAbi
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
          return await getBalance(tokenAddress, tokenAbi, _provider, _providerType, maxRetries - 1);
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries.`);
      } else throw Error(`Unable to make request and couldn't retry.`);
    }
  };

  const callContract = async (
    contractAddress: string,
    abi: string,
    functionName: string,
    params: any[],
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

          const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
          const currentUserAddress = ercInfo?.address;

          return await externalNetworkWalletConnectWrapper.callContract(
            _provider,
            contractAddress,
            abi,
            functionName,
            walletConnectClient.current,
            walletConnectSession.current,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            walletConnectPairing.current!,
            params,
            currentUserAddress
          );
        }
        case externalNetworkProviderTypes.metamask: {
          // if (!syriusClient.current) throw Error("Client was not initialized");
          const response = await metamaskWrapper.callContract(_provider, contractAddress, abi, functionName, params);
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
            _providerType,
            _provider,
            maxRetries - 1
          );
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries.`);
      } else throw Error(`Unable to make request and couldn't retry.`);
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
          // if (!syriusClient.current) throw Error("Client was not initialized");
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
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries.`);
      } else throw Error(`Unable to make request and couldn't retry.`);
    } finally {
      addBeforeUnloadEvents();
    }
  };

  const handleError = async (error: any) => {
    const handledError = {
      shouldRetry: false,
    };
    try {
      if (error?.code == -32602 && error?.message?.toLowerCase()?.includes(`Bad state: No element`.toLowerCase())) {
        // error.message = 'Bad state: No element';
        if (!walletConnectClient.current) throw Error("Client was not initialized");
        if (!walletConnectSession.current) throw Error("Session was not established");
        if (!walletConnectPairing.current) throw Error("Pairing was not established");

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

      console.warn("error?.message", error?.message);
      if (
        error?.code == -32602 &&
        // error?.message?.toLowerCase()?.includes(`"No matching key. session topic doesn't exist:`.toLowerCase())
        error?.message?.toLowerCase()?.includes(`No matching key`.toLowerCase())
      ) {
        if (!walletConnectClient.current) throw Error("Client was not initialized");
        if (!walletConnectSession.current) throw Error("Session was not established");
        if (!walletConnectPairing.current) throw Error("Pairing was not established");

        // console.log("Reconnecting...");
        // await walletConnectClient.current.disconnect({
        //   topic: walletConnectPairing.current.topic,
        //   reason: {
        //     code: error.code,
        //     message: error.message || "Socket error",
        //     data: error.message || "Socket error",
        //   },
        // });
        // const {session, pairing} = await externalNetworkWalletConnectWrapper.connect(walletConnectClient.current);
        // walletConnectSession.current = session;
        // walletConnectPairing.current = pairing;

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

    const walletInfo = await getWalletInfo(_provider, _providerType);
    console.log("getWalletInfo", walletInfo);
    dispatch(storeErcInfo(JSON.stringify(walletInfo)));

    // ToDo: Create a connection slice for external data
    // Or split existing one into 2
    // dispatch(storeChainIdentifier(newChainId));
  };

  const ifNeedReplaceNodeWithDefaultAndNotifyUser = (nodeUrl: string): any => {
    if (nodeUrl?.toLowerCase()?.includes("embedded") || nodeUrl?.includes("127.0.0.1")) {
      // Embedded node is selected.
      // This might cause problems because browser may be restricted to connect to local node
      // Use the default node from constants
      //
      toast(
        `Cannot connect to selected node (${nodeUrl}). Please pick another one from Syrius. Connecting to ${globalConstants.defaultNodeToConnect} instead.`,
        {
          position: "bottom-center",
          autoClose: 15000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "info",
          theme: "dark",
        }
      );

      return globalConstants.defaultNodeToConnect;
    } else {
      return nodeUrl;
    }
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
                // setReferralCodeAddress(referrerAddress || "");
                // dispatch(storeReferralCode(mangleReferralCode(extraData.affiliate.toString())));
                dispatch(storeReferralCode(extraData.affiliate.toString()));
                toast(`Referral code changed. You will receive 1% bonus when unwrapping wZNN => ZNN and wQSR => QSR`, {
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
            console.log("Detected existing referall code: ", getReferralAddress());
            console.log("Using the old(existing) one", getReferralAddress());
            dispatch(storeReferralCode(getReferralAddress()));
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      let readableError = err;
      if (err?.message) {
        readableError = err?.message;
      }
      readableError = (readableError + "").split("Error: ")[(readableError + "").split("Error: ").length - 1];
      console.error("readableError", readableError);

      if (getReferralAddress()) {
        console.log("Invalid referral code found on node. Using existing: ", getReferralAddress());
        try {
          if (Primitives.Address.parse(getReferralAddress())) {
            // setReferralCodeAddress(referrerAddress || "");
            // dispatch(storeReferralCode(mangleReferralCode(extraData.affiliate.toString())));
            dispatch(storeReferralCode(getReferralAddress()));
            toast(`Referral code changed. You will receive 1% bonus when unwrapping wZNN => ZNN and wQSR => QSR`, {
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
          console.error("Invalid Referral Code found on connected node and locally.");
          dispatch(storeReferralCode(undefined));
          toast("Invalid Referral Code found locally", {
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
        console.log("Invalid referral code found on node. No existing referral code found either.");
        dispatch(storeReferralCode(undefined));
      }

      toast("Invalid referral code found on node. No existing referral code found either", {
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

  const externalNetworkProvider = {
    coreClient:
      providerType == externalNetworkProviderTypes.walletConnect ? walletConnectClient.current : syriusClient.current,
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
  };

  return <ExternalNetworkContext.Provider value={externalNetworkProvider}>{children}</ExternalNetworkContext.Provider>;
};
