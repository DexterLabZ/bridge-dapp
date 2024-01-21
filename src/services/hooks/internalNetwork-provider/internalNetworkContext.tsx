import React, { FC, createContext, useEffect, useRef, useState } from "react";
import Client from "@walletconnect/sign-client";
import internalNetworkWalletConnectWrapper from "./internalNetworkWalletConnectWrapper";
import { SessionTypes, PairingTypes } from "@walletconnect/types";
import syriusExtensionWrapper from "./syriusExtensionWrapper";
import { Primitives, Zenon } from "znn-ts-sdk";
import { AccountBlockTemplate } from "znn-ts-sdk/dist/lib/src/model/nom/account_block_template";
import { useDispatch, useSelector } from "react-redux";
import {
  resetInternalNetworkConnectionState,
  storeChainIdentifier,
  storeNodeUrl,
} from "../../redux/internalNetworkConnectionSlice";
import { toast } from "react-toastify";
import { resetZenonInfo, storeZenonInfo } from "../../redux/walletSlice";
import { getReferralAddress, getZenonWalletInfo } from "../../../utils/utils";
import { addBeforeUnloadEvents, removeBeforeUnloadEvents } from "../../pageHandlers/pageHandlers";
import { storeReferralCode } from "../../redux/referralSlice";
import { WalletConnectModal } from "@walletconnect/modal";

export enum internalNetworkProviderTypes {
  "walletConnect" = "walletConnect",
  "syriusExtension" = "syriusExtension",
}

export const InternalNetworkContext = createContext<any>(null);

export type syriusClientType = {
  zenon: Zenon;
  eventsHandler: any;
};

export type InternalWalletInfo = {
  address: string;
  chainId: number;
  nodeUrl: string;
};

export const InternalNetworkProvider: FC<{ children: any }> = ({ children }) => {
  const walletConnectClient = useRef<Client | null>(null);
  const wcModal = useRef<WalletConnectModal | null>(null);
  const syriusClient = useRef<syriusClientType | null>(null);
  const walletConnectSession = useRef<SessionTypes.Struct | null>(null);
  const walletConnectPairing = useRef<PairingTypes.Struct | null>(null);
  const [providerType, setProviderType] = useState<internalNetworkProviderTypes | null>(null);
  const [displayedProviderType, setDisplayedProviderType] = useState<string | null>(null);
  const maxRequestRetries = 3;
  const zenonSingleton = Zenon.getSingleton();
  const [globalConstants, setGlobalConstants] = useState(useSelector((state: any) => state.globalConstants));
  const dispatch = useDispatch();

  // Initialize the internalNetworkProvider when the component mounts
  useEffect(() => {
    return () => {
      // Clean up the internalNetworkProvider when the component unmounts
      if (providerType) {
        switch (providerType) {
          case internalNetworkProviderTypes.walletConnect: {
            if (walletConnectClient.current && walletConnectPairing.current) {
              internalNetworkWalletConnectWrapper.disconnectPairing(
                walletConnectClient.current,
                walletConnectPairing.current
              );
              walletConnectClient.current = null;
            }
            break;
          }
          case internalNetworkProviderTypes.syriusExtension: {
            if (syriusClient.current) {
              zenonSingleton.clearSocketConnection();
              syriusClient.current = null;
            }
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

  const init = async (_providerType: internalNetworkProviderTypes) => {
    console.log("InternalNetworkContext init, ", _providerType);
    if (!_providerType) throw Error("No provider type selected");
    setProviderType(_providerType);
    console.log("providerType", providerType);
  };

  const connectSyrius = async (
    _providerType: internalNetworkProviderTypes,
    onDismiss?: (reason: string) => unknown
  ): Promise<boolean> => {
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
      case internalNetworkProviderTypes.walletConnect: {
        const walletClient = walletConnectClient.current || (await internalNetworkWalletConnectWrapper.initClient());
        walletConnectClient.current = walletClient;

        // const wcModalInstance = wcModal.current || (await internalNetworkWalletConnectWrapper.initModal());
        // wcModal.current = wcModalInstance;

        // Because internalNetworkWalletConnectWrapper.connect triggers an window.open - we dont want to
        // keep the beforeUnload event that asks the user if he wants to leave the page.
        removeBeforeUnloadEvents();
        const { session, pairing } = await internalNetworkWalletConnectWrapper.connect(
          walletClient,
          // wcModalInstance,
          onDismiss
        );
        addBeforeUnloadEvents();

        walletConnectSession.current = session;
        walletConnectPairing.current = pairing;

        internalNetworkWalletConnectWrapper.registerEvents(
          walletClient,
          onAddressChange,
          onChainIdChange,
          onConnectedNodeChange
        );
        return true;
      }
      case internalNetworkProviderTypes.syriusExtension: {
        syriusClient.current = {
          zenon: zenonSingleton,
          eventsHandler: syriusExtensionWrapper.registerEvents(onAddressChange, onChainIdChange, onConnectedNodeChange),
        };

        return true;
      }
      default: {
        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const disconnect = async (_providerType: internalNetworkProviderTypes): Promise<boolean> => {
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
      case internalNetworkProviderTypes.walletConnect: {
        if (walletConnectClient.current) {
          internalNetworkWalletConnectWrapper.disconnectAllPairings(walletConnectClient.current);
          internalNetworkWalletConnectWrapper.disconnectAllSessions(walletConnectClient.current);
          walletConnectSession.current = null;
          walletConnectPairing.current = null;

          walletConnectClient.current = null;
          setProviderType(null);

          dispatch(resetZenonInfo());
          dispatch(resetInternalNetworkConnectionState());
        }
        return true;
      }
      case internalNetworkProviderTypes.syriusExtension: {
        syriusExtensionWrapper.unregisterEvents(syriusClient.current?.eventsHandler);
        syriusClient.current = null;
        setProviderType(null);

        dispatch(resetZenonInfo());
        dispatch(resetInternalNetworkConnectionState());

        return true;
      }
      default: {
        syriusClient.current = null;
        walletConnectClient.current = null;
        walletConnectSession.current = null;
        walletConnectPairing.current = null;

        dispatch(resetZenonInfo());
        dispatch(resetInternalNetworkConnectionState());

        throw Error(`Unknown providerType: ${_providerType}`);
      }
    }
  };

  const connectToNode = async (nodeUrl: string): Promise<void> => {
    zenonSingleton.clearSocketConnection();
    return zenonSingleton.initialize(nodeUrl, false, 10000);
  };

  const getWalletInfo = async (
    _providerType: internalNetworkProviderTypes | null = providerType,
    maxRetries: number = maxRequestRetries
  ): Promise<InternalWalletInfo> => {
    if (!_providerType) throw Error("No provider type selected");

    try {
      switch (_providerType) {
        case internalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");
          // Because internalNetworkWalletConnectWrapper.connect triggers an window.open - we dont want to
          // keep the beforeUnload event that asks the user if he wants to leave the page.
          removeBeforeUnloadEvents();
          const info = await internalNetworkWalletConnectWrapper.getInfo(
            walletConnectClient.current,
            walletConnectSession.current
          );
          addBeforeUnloadEvents();

          info.nodeUrl = ifNeedReplaceNodeWithDefaultAndNotifyUser(info.nodeUrl);
          dispatch(storeNodeUrl(info.nodeUrl));
          dispatch(storeChainIdentifier(info.chainId));
          return info;
        }
        case internalNetworkProviderTypes.syriusExtension: {
          // if (!syriusClient.current) throw Error("Client was not initialized");
          const info = await syriusExtensionWrapper.getInfo();
          info.nodeUrl = ifNeedReplaceNodeWithDefaultAndNotifyUser(info.nodeUrl);
          dispatch(storeNodeUrl(info.nodeUrl));
          dispatch(storeChainIdentifier(info.chainId));
          return info;
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
          return await getWalletInfo(_providerType, maxRetries - 1);
        } else throw Error(`Unable to make request after ${maxRequestRetries} retries.`);
      } else throw Error(`Unable to make request and couldn't retry.`);
    }
  };

  const sendTransaction = async (
    params: {
      fromAddress: any;
      accountBlock: any;
    },
    _providerType: internalNetworkProviderTypes | null = providerType,
    maxRetries: number = maxRequestRetries
  ): Promise<AccountBlockTemplate> => {
    if (!_providerType) throw Error("No provider type selected");
    console.log("internalNetworkContext - sendTransaction - params", params);

    try {
      switch (_providerType) {
        case internalNetworkProviderTypes.walletConnect: {
          if (!walletConnectClient.current) throw Error("Client was not initialized");
          if (!walletConnectSession.current) throw Error("Session was not established");

          console.log("internalNetworkContext - sending - session", walletConnectSession.current);
          console.log("internalNetworkContext - sending - pairing", walletConnectPairing?.["current"]);

          // Because internalNetworkWalletConnectWrapper.connect triggers an window.open - we dont want to
          // Keep the beforeUnload event that asks the user if he wants to leave the page.
          removeBeforeUnloadEvents();
          const transaction = await internalNetworkWalletConnectWrapper.sendTransaction(
            walletConnectClient.current,
            walletConnectSession.current,
            params
          );
          addBeforeUnloadEvents();
          return transaction;
        }
        case internalNetworkProviderTypes.syriusExtension: {
          if (!syriusClient.current) throw Error("Client was not initialized");
          return await syriusExtensionWrapper.sendTransaction(params.accountBlock);
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
      } else throw Error(`Unable to make request and couldn't retry. Error: ${handledError.message}`);
    }
  };

  const handleError = async (error: any) => {
    const handledError = {
      shouldRetry: false,
      message: "",
    };
    try {
      if (error.code == -32602 && error.message?.toLowerCase()?.includes(`Bad state: No element`.toLowerCase())) {
        if (!walletConnectClient.current) throw Error("Client was not initialized");
        if (!walletConnectSession.current) throw Error("Session was not established");
        if (!walletConnectPairing.current) throw Error("Pairing was not established");

        // Disconnect current pair and reconnect with new pair
        await walletConnectClient.current.disconnect({
          topic: walletConnectPairing.current.topic,
          reason: {
            code: error.code,
            message: error.message || "Socket error",
            data: error.message || "Socket error",
          },
        });
        console.log("Reconnecting...");
        const { session, pairing } = await internalNetworkWalletConnectWrapper.connect(
          walletConnectClient.current
          // wcModal.current as WalletConnectModal
        );
        walletConnectSession.current = session;
        walletConnectPairing.current = pairing;
        handledError.shouldRetry = true;
        handledError.message = error.message;
      }

      console.warn("error.message", error.message);
      if (error.code == -32602 && error.message?.toLowerCase()?.includes(`No matching key`.toLowerCase())) {
        if (!walletConnectClient.current) throw Error("Client was not initialized");
        if (!walletConnectSession.current) throw Error("Session was not established");
        if (!walletConnectPairing.current) throw Error("Pairing was not established");

        console.log("Retrying...");
        handledError.shouldRetry = true;
      }

      if (
        error.code == -32602 &&
        error.message
          ?.toLowerCase()
          ?.includes(`type 'Null' is not a subtype of type 'Map<String, dynamic>'`.toLowerCase())
      ) {
        // Todo: Decide what to do in this case
        //
        // if (!walletConnectClient.current) throw Error("Client was not initialized");
        // if (!walletConnectSession.current) throw Error("Session was not established");
        // if (!walletConnectPairing.current) throw Error("Pairing was not established");
        // // Disconnect current pair and reconnect with new pair
        // await walletConnectClient.current.disconnect({
        //   topic: walletConnectPairing.current.topic,
        //   reason: {
        //     code: error.code,
        //     message: error.message || "Socket error",
        //     data: error.message || "Socket error",
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

  const onConnectedNodeChange = async (newNodeUrl: string, providerType: internalNetworkProviderTypes) => {
    try {
      console.log("__nodeChanged to", newNodeUrl);
      console.log("providerType", providerType);
      newNodeUrl = ifNeedReplaceNodeWithDefaultAndNotifyUser(newNodeUrl);
      await connectToNode(newNodeUrl);
      dispatch(storeNodeUrl(newNodeUrl));
      console.log("zenonSingleton", zenonSingleton);
      console.log("zenonSingleton?.wsClient?.url", zenonSingleton?.wsClient?.url);
      if (zenonSingleton?.wsClient?.url) {
        checkForAffiliationCodeFromNode(zenonSingleton);
      }
    } catch (err) {
      console.error("Error after changing node", err);
    }
  };

  const onAddressChange = async (newAddress: string, providerType: internalNetworkProviderTypes) => {
    console.log("__addressChanged to", newAddress);
    console.log("providerType", providerType);
    const newZenonInfo = await getZenonWalletInfo(zenonSingleton, newAddress);
    console.log("newZenonInfo", newZenonInfo);
    dispatch(storeZenonInfo(JSON.stringify(newZenonInfo)));
  };

  const onChainIdChange = (newChainId: string, providerType: internalNetworkProviderTypes) => {
    console.log("providerType", providerType);
    console.log("__chainIdChanged to", newChainId);
    dispatch(storeChainIdentifier(newChainId));
  };

  const ifNeedReplaceNodeWithDefaultAndNotifyUser = (nodeUrl: string): any => {
    if (nodeUrl.toLowerCase().includes("embedded") || nodeUrl.includes("127.0.0.1")) {
      // Embedded node is selected.
      // This might cause problems because browser may be restricted to connect to local node
      // Instead, use the default node from constants
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

  const internalNetworkProvider = {
    coreClient:
      providerType == internalNetworkProviderTypes.walletConnect ? walletConnectClient.current : syriusClient.current,
    providerType: providerType,
    displayedProviderType: displayedProviderType,
    init: init,
    disconnect: disconnect,
    connectSyrius: connectSyrius,
    connectToNode: connectToNode,
    getWalletInfo: getWalletInfo,
    sendTransaction: sendTransaction,
  };

  return <InternalNetworkContext.Provider value={internalNetworkProvider}>{children}</InternalNetworkContext.Provider>;
};
