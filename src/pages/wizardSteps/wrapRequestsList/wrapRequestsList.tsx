import { Buffer } from "buffer";
import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Zenon } from "znn-ts-sdk";
import NavMenuButton from "../../../components/nav-menu-button/nav-menu-button";
import Paginator from "../../../components/paginator/paginator";
import WrapRequestItemComponent from "../../../components/wrapRequestItemComponent/wrapRequestItemComponent";
import { WrapRequestItem, wrapRequestStatus } from "../../../models/wrapRequestItem";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import { clearActiveWrapRequest, storeSuccessInfo } from "../../../services/redux/requestsSlice";
import { storeCurrentWizardFlowStep } from "../../../services/redux/wizardStatusSlice";
import constants from "../../../utils/constants";
import { simpleNetworkType, simpleTokenType } from "../swapStep/swapStep";
import newSwapSvg from "./../../../assets/icons/swap.svg";
import discordLogo from "./../../../assets/logos/discord-logo.svg";
import forumLogo from "./../../../assets/logos/forum-logo.svg";
import telegramLogo from "./../../../assets/logos/telegram.svg";
import twitterLogo from "./../../../assets/logos/twitter.svg";
import useExternalNetwork from "../../../services/hooks/externalNetwork-provider/useExternalNetwork";
import { curateWrapRequestsForSupernova } from "../../../utils/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const WrapRequestsList = ({ onStepSubmit = () => {} }) => {
  const newSwapIcon = <img alt="" className="" height="15px" src={newSwapSvg} />;

  const storedRequests = useSelector((state: any) => state.requests);
  const walletInfo = useSelector((state: any) => state.wallet);
  const [requestItems, setRequestItems] = useState<Array<WrapRequestItem>>([]);
  const [maxPages, setMaxPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const dispatch = useDispatch();
  const { handleSpinner } = useContext(SpinnerContext);
  const itemsPerPage = 5;
  const interval = useRef<any>();
  const [metamaskChainId, setMetamaskChainId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const globalConstants = useSelector((state: any) => state.globalConstants);
  const refreshInterval = 30000;
  const { externalNetworkClient } = useExternalNetwork();

  useEffect(() => {
    getRequests(currentPage, itemsPerPage);
    interval.current = setInterval(getRequests, refreshInterval);

    const updateMetamaskChainId = async () => {
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      const provider = await externalNetworkClient.getProvider();

      // ToDo: maybe this will not work with jsonRpcProvider
      setMetamaskChainId((await provider.getNetwork())?.chainId);
    };
    updateMetamaskChainId();

    const changeEventHandlers = detectExtensionsChanges();
    return () => {
      removeWeb3ChangeListeners(changeEventHandlers);
      clearInterval(interval.current);
    };
  }, [walletInfo.ercInfo]);

  useEffect(() => {
    getRequests(currentPage, itemsPerPage);
    clearInterval(interval.current);
    interval.current = setInterval(() => {
      getRequests(currentPage, itemsPerPage);
    }, refreshInterval);
    return () => clearInterval(interval.current);
  }, [metamaskChainId]);

  useEffect(() => {
    getRequests(currentPage, itemsPerPage);
    clearInterval(interval.current);
    interval.current = setInterval(() => {
      getRequests(currentPage, itemsPerPage);
    }, refreshInterval);
    return () => clearInterval(interval.current);
  }, [currentPage]);

  const detectExtensionsChanges = () => {
    const accountChangedHandler = async (accounts: any) => {
      console.log("accountChangedHandler", accounts);
    };
    window?.ethereum?.on("accountsChanged", accountChangedHandler);

    const chainChangedHandler = async (chainId: any) => {
      console.log("chainChangedHandler", ethers.BigNumber.from(chainId).toNumber());
      setMetamaskChainId(ethers.BigNumber.from(chainId).toNumber());
      // window.location.reload();
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

  const getRequests = async (_currentPage: number = currentPage, _itemsPerPage: number = itemsPerPage) => {
    setIsLoading(true);
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold">Getting requests ...</div>
      </>,
      "requests-list-root"
    );
    try {
      showSpinner(true);
      const zenon = Zenon.getSingleton();

      let activeRequest = JSON.parse(storedRequests.activeWrapRequest || "{}");
      console.log("Active request", activeRequest);

      const ercInfo = JSON.parse(walletInfo.ercInfo || "{}");
      const toAddress = ercInfo?.address;

      console.log("Getting requests for toAddress", toAddress);
      console.log("Getting requests for", _currentPage, _itemsPerPage, currentPage, itemsPerPage);

      let getAllWrapTokenRequestsByToAddress: { count: number; list: any[] } = { count: 0, list: [] };

      if (globalConstants?.isSupernovaNetwork) {
        getAllWrapTokenRequestsByToAddress =
          await zenon.embedded.bridge.getAllWrapTokenRequestsByToAddressNetworkClassAndChainId(
            toAddress,
            globalConstants?.externalAvailableNetworks.find((n: simpleNetworkType) => n.isAvailable)?.networkClass,
            parseInt(globalConstants?.supernovaChainId?.toString()),
            _currentPage,
            _itemsPerPage
          );
      } else {
        getAllWrapTokenRequestsByToAddress = await zenon.embedded.bridge.getAllWrapTokenRequestsByToAddress(
          toAddress,
          _currentPage,
          _itemsPerPage
        );
      }
      setMaxPages(Math.ceil(getAllWrapTokenRequestsByToAddress.count / _itemsPerPage));
      console.log("getAllWrapTokenRequestsByToAddress", getAllWrapTokenRequestsByToAddress);
      console.log(
        "JSONbig.stringify(getAllWrapTokenRequestsByToAddress)",
        JSONbig.parse(JSONbig.stringify(getAllWrapTokenRequestsByToAddress))
      );

      const transformedWrapRequests = await Promise.all(
        getAllWrapTokenRequestsByToAddress.list.map(transformWrapRequest)
      );

      const oldRequests = JSON.parse(localStorage.getItem("wrapRequests") || "[]").map((req: any) =>
        WrapRequestItem.fromJson(req)
      );
      const newRequests = transformedWrapRequests.map((req: any) => WrapRequestItem.fromJson(req));

      // Only add the active request on the first page
      if (_currentPage !== 0) {
        activeRequest = storedRequests.emptyWrapRequest;
      }

      let mergedWrapRequests = mergeAndSortWrapRequests(oldRequests, newRequests, activeRequest);

      mergedWrapRequests = await Promise.all(
        mergedWrapRequests.map(async (reqItem: WrapRequestItem) => {
          console.log("reqChainId, currentChainId", reqItem.chainId, metamaskChainId);
          if (reqItem.chainId == metamaskChainId) {
            reqItem = (await getWrapRequestStatus(reqItem)) || reqItem;
          }
          console.log("Updated status of", JSONbig.parse(JSONbig.stringify(reqItem)));
          return reqItem;
        })
      );

      saveWrapRequestsToLocalStorage(mergedWrapRequests, oldRequests);

      const curatedForSupernova = curateWrapRequestsForSupernova(mergedWrapRequests);
      setRequestItems(curatedForSupernova);
    } catch (err) {
      console.error(err);
    } finally {
      showSpinner(false);
      setIsLoading(false);
    }
  };

  const transformWrapRequest = async (request: { [key: string]: any }) => {
    request.toToken = globalConstants.externalAvailableTokens.find(
      (tok: simpleTokenType) =>
        tok.address?.toLowerCase() == request.tokenAddress?.toLowerCase() && tok.network.chainId == request?.chainId
    );

    request.fromToken = {
      symbol: request.token?.symbol,
      address: request.token?.tokenStandard.toString(),
      decimals: request.token?.decimals,
      ...globalConstants.internalAvailableTokens.find(
        (tok: simpleTokenType) => tok.address?.toLowerCase() == request.token.tokenStandard?.toLowerCase()
      ),
    };

    request.amount = request.amount.toString();
    request.token.maxSupply = request?.token?.maxSupply.toString();
    request.token.totalSupply = request?.token?.totalSupply.toString();
    request.fee = request?.fee.toString();

    const reqItem = WrapRequestItem.fromJson(request);

    console.log("transformWrapRequest", reqItem);

    if (!request?.signature?.length) {
      reqItem.status = wrapRequestStatus.Signing;
    }

    if (request?.fee) {
      reqItem.feeAmount = request?.fee;
    }

    return reqItem;
  };

  const mergeAndSortWrapRequests = (
    oldRequests: Array<WrapRequestItem>,
    newRequests: Array<WrapRequestItem>,
    activeRequest: WrapRequestItem
  ): Array<WrapRequestItem> => {
    let isActiveRequestInList = false;
    const mergedRequests: Array<WrapRequestItem> = newRequests.map((request: WrapRequestItem) => {
      const oldRequestEquivalent: WrapRequestItem = oldRequests.filter((req: WrapRequestItem) => {
        return req?.id === request?.id;
      })[0];

      if (oldRequestEquivalent) {
        oldRequestEquivalent.signature = request.signature;

        if (
          (!oldRequestEquivalent.status || oldRequestEquivalent.status == wrapRequestStatus.Signing) &&
          (request?.signature?.length || 0) > 0
        ) {
          oldRequestEquivalent.status = wrapRequestStatus.Redeemable;
        } else if (request.status) {
          oldRequestEquivalent.status = request.status;
          oldRequestEquivalent.redeemDelayInSeconds = request.redeemDelayInSeconds;
        }

        Object.assign(request, oldRequestEquivalent);
      }

      if (request.id === activeRequest?.id) {
        request.isActiveRequest = true;
        isActiveRequestInList = true;
      }
      return request;
    });

    if (!isActiveRequestInList && (activeRequest?.toAddress?.length || 0) > 0) {
      mergedRequests.unshift(activeRequest);
    }

    return mergedRequests;
    // return mergedRequests.sort((a: WrapRequestItem, b: WrapRequestItem) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  const getWrapRequestStatus = async (wrapRequest: WrapRequestItem) => {
    try {
      console.log("getWrapRequestStatus");
      const provider = await externalNetworkClient.getProvider();
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("provider", provider);

      const currentContractAddress = wrapRequest?.toToken?.network?.contractAddress || "";
      console.log("currentContractAddress", currentContractAddress);

      const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
      console.log("contract", contract);

      // const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      // console.log("signer", signer);

      // const signedContract = contract.connect(signer);
      // console.log("signedContract", signedContract);

      const tokenAddress = wrapRequest.tokenAddress;
      console.log("tokenAddress", tokenAddress);
      const amount = ethers.BigNumber.from(wrapRequest.amount).sub(ethers.BigNumber.from(wrapRequest.feeAmount || 0));
      console.log("amount", amount);

      const id = wrapRequest.id;

      console.log("id", "0x" + id);

      if (wrapRequest?.signature && wrapRequest?.signature.length > 0) {
        const signature = Buffer.from(wrapRequest.signature || "", "base64");
        signature[signature.length - 1] = signature[signature.length - 1] + 27;
        const newSig = signature.toString("hex");

        console.log("estimateGas.redeem", wrapRequest.toAddress, tokenAddress, amount, "0x" + id, "0x" + newSig);
        // await signedContract.estimateGas.redeem(wrapRequest.toAddress, tokenAddress, amount, "0x" + id, "0x" + newSig);

        if (
          wrapRequest.status == wrapRequestStatus.Signing ||
          wrapRequest.status == wrapRequestStatus.FinalRedeemed ||
          wrapRequest.status == wrapRequestStatus.Broken
        ) {
          wrapRequest.status = wrapRequestStatus.Redeemable;
        }

        const redeemsInfo = await contract.redeemsInfo("0x" + id);
        console.log("redeemsInfo", redeemsInfo);

        const blockNumber = ethers.BigNumber.from(redeemsInfo.blockNumber);
        console.log("blockNumber", blockNumber);
        console.log("blockNumber.toString()", blockNumber?.toString());

        if (
          blockNumber?.toString() === "115792089237316195423570985008687907853269984665640564039457584007913129639935"
        ) {
          console.log("Final redeemed");
          // Final redeemed
          wrapRequest.status = wrapRequestStatus.FinalRedeemed;
        } else {
          if (blockNumber.gt(0)) {
            // Redeemed 1/2
            console.log("Redeemed 1/2");
            const block = await provider.getBlock(blockNumber?.toNumber());
            console.log("Redeemed 1/2 - block", block);
            const blockTimestamp = block.timestamp;
            wrapRequest.timestamp = blockTimestamp;
            wrapRequest.status = wrapRequestStatus.WaitingDelay;
          } else {
            // Not redeemed
            console.log("Not redeemed");
            wrapRequest.status = wrapRequestStatus.Redeemable;
          }
        }

        if (!wrapRequest?.transactionHash) {
          console.log("redeemDelayInSeconds????", wrapRequest);
          wrapRequest = await updateRedeemDelayAndStatus(wrapRequest);
          console.log("redeemDelayInSeconds???? after", wrapRequest);
        }

        return wrapRequest;
      }
    } catch (err: any) {
      console.warn("err ", err);
      const readableError = JSON.stringify(err).toLowerCase();
      console.warn("readableError ", readableError);

      if (readableError.includes(`redeem: not redeemable yet`)) {
        // Increase the timer if this happens
        wrapRequest = await updateRedeemDelayAndStatus(wrapRequest);

        console.log("wrapRequest", wrapRequest);
        console.log("Updated redeemDelayInSeconds", wrapRequest.redeemDelayInSeconds);

        return wrapRequest;
      } else if (readableError.includes(`redeem: nonce already redeemed`)) {
        wrapRequest.status = wrapRequestStatus.FinalRedeemed;
        wrapRequest.isActiveRequest = false;
      } else if (readableError.includes(`invalid signature length`)) {
        wrapRequest.status = wrapRequestStatus.Signing;
      } else if (readableError.includes(`redeem: wrong signature`)) {
        wrapRequest.status = wrapRequestStatus.Broken;
      } else {
        wrapRequest.status = wrapRequestStatus.Broken;
      }

      return wrapRequest;
    }
  };

  const saveWrapRequestsToLocalStorage = (
    newRequests: Array<WrapRequestItem>,
    oldRequests: Array<WrapRequestItem> = []
  ) => {
    console.log("saveWrapRequestsToLocalStorage - newRequests", newRequests);
    if (oldRequests.length == 0) {
      oldRequests = JSON.parse(localStorage.getItem("wrapRequests") || "[]").map((req: any) =>
        WrapRequestItem.fromJson(req)
      );
    }

    newRequests.map((request: WrapRequestItem) => {
      let foundIndex = -1;
      foundIndex = oldRequests.findIndex((req) => req?.id === request?.id);

      if (foundIndex != -1) {
        console.log("Found new request", request);
        oldRequests[foundIndex] = request;
      } else {
        oldRequests.push(request);
      }
    });

    localStorage.setItem("wrapRequests", JSON.stringify(oldRequests));
    return oldRequests;
  };

  const updateRedeemDelayAndStatus = async (wrapRequest: WrapRequestItem) => {
    try {
      console.log("updateRedeemDelayAndStatus");
      // const web3Instance = new ethers.providers.Web3Provider(window.ethereum);
      // const provider = web3Instance;
      const provider = await externalNetworkClient.getProvider();
      const currentContractAddress = wrapRequest?.toToken?.network?.contractAddress || "";
      console.log("currentContractAddress", currentContractAddress);

      const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
      // const signer = web3Instance.getSigner();
      // const signedContract = contract.connect(signer);

      const redeemDelay = (await contract.tokensInfo(wrapRequest.toToken?.address))?.redeemDelay || 1;
      console.log(
        "(await contract.tokensInfo(ercToken.address))",
        await contract.tokensInfo(wrapRequest.toToken?.address)
      );
      console.log("redeemDelay", redeemDelay);

      const estimatedBlockTimeInSeconds = await provider.estimatedBlockTime();
      console.log("_estimatedBlockTimeInSeconds", estimatedBlockTimeInSeconds.toNumber());

      const redeemsInfo = await contract.redeemsInfo("0x" + wrapRequest.id);
      console.log("_redeemsInfo", redeemsInfo);

      const blockNumber = ethers.BigNumber.from(redeemsInfo.blockNumber);
      console.log("_blockNumber", blockNumber);
      console.log("_blockNumber.toString()", blockNumber?.toString());
      wrapRequest.transactionBlockNumber = blockNumber?.toNumber();

      const block = await provider.getBlock(blockNumber?.toNumber());
      console.log("_block", block);
      wrapRequest.timestamp = block.timestamp;

      console.log("wrapRequest before updating redeemDelayInSeconds", wrapRequest);

      if (wrapRequest.transactionBlockNumber && wrapRequest.id && wrapRequest.timestamp) {
        const currentBlockNumber = await provider.getBlockNumber();
        const elapsedBlocks = currentBlockNumber - wrapRequest.transactionBlockNumber;
        console.log("elapsedBlocks", elapsedBlocks);
        const elapsedSeconds = elapsedBlocks * estimatedBlockTimeInSeconds;
        console.log("elapsedSeconds", elapsedSeconds);

        // Adding one more block to be certain that the conditions pass
        const remainingBlocks = redeemDelay - elapsedBlocks + 1;
        console.log("remainingBlocks", remainingBlocks);
        const remainingSeconds = remainingBlocks * estimatedBlockTimeInSeconds;
        console.log("remainingSeconds", remainingSeconds);

        if (remainingSeconds > 0) {
          const secondsBetweenTimestampAndNow = Date.now() / 1000 - wrapRequest.timestamp;
          console.log("secondsBetweenTimestampAndNow", secondsBetweenTimestampAndNow);
          wrapRequest.redeemDelayInSeconds = secondsBetweenTimestampAndNow + remainingSeconds;
        } else {
          wrapRequest.redeemDelayInSeconds = (wrapRequest.redeemDelayInSeconds || 0) + refreshInterval / 1000;
        }
      }

      console.log("wrapRequest after updating redeemDelayInSeconds", wrapRequest);

      return wrapRequest;
    } catch (err) {
      return wrapRequest;
    }
  };

  const redeemRequest = async (wrapRequest: WrapRequestItem) => {
    // ToDo: Should we add the spinner here?

    try {
      // const web3Instance = new ethers.providers.Web3Provider(window.ethereum);
      // const provider = web3Instance;
      const provider = await externalNetworkClient.getProvider();
      console.log("Provider", provider);
      const currentContractAddress = wrapRequest?.toToken?.network?.contractAddress || "";
      console.log("currentContractAddress", currentContractAddress);

      const contract = new ethers.Contract(currentContractAddress, globalConstants.abiContract, provider);
      // const signer = web3Instance.getSigner();
      // const signedContract = contract.connect(signer);

      const tokenAddress = wrapRequest.tokenAddress;
      const amount = ethers.BigNumber.from(wrapRequest.amount).sub(ethers.BigNumber.from(wrapRequest.feeAmount || 0));
      const id = wrapRequest.id;

      const signature = Buffer.from(wrapRequest.signature || "", "base64");
      signature[signature.length - 1] = signature[signature.length - 1] + 27;
      const newSig = signature.toString("hex");

      //
      // Update redeemDelay of request
      //
      const redeemDelay = ((await contract.tokensInfo(wrapRequest.tokenAddress))?.redeemDelay || 1) + 1;
      console.log("__wrap__redeemDelay", redeemDelay);
      const estimatedBlockTimeInSeconds = await contract.estimatedBlockTime();
      console.log("__wrap__estimatedBlockTimeInSeconds", estimatedBlockTimeInSeconds);

      (wrapRequest.redeemDelayInSeconds = redeemDelay * estimatedBlockTimeInSeconds.toNumber()),
        console.log("Redeem params", wrapRequest.toAddress, tokenAddress, amount, "0x" + id, "0x" + newSig);
      console.log("contract", contract);
      // const redeemResponse = await signedContract.redeem(
      //   wrapRequest.toAddress,
      //   tokenAddress,
      //   amount,
      //   "0x" + id,
      //   "0x" + newSig
      // );

      const redeemTransactionParams = [wrapRequest.toAddress, tokenAddress, amount, "0x" + id, "0x" + newSig];
      console.log("redeemTransactionParams", redeemTransactionParams);

      const functionToBeCalled = globalConstants.isSupernovaNetwork ? "redeemNative" : "redeem";
      console.log("functionToBeCalled", functionToBeCalled);

      const redeemResponse = await externalNetworkClient.callContract(
        currentContractAddress,
        globalConstants.abiContract,
        functionToBeCalled,
        redeemTransactionParams
      );
      console.log("redeemResponse", redeemResponse);

      console.log("redeemResponse", redeemResponse);
      // await redeemResponse.wait();

      // Remove the 0x. We add it later
      wrapRequest.transactionHash = redeemResponse.hash.substr(2);
      console.log("redeemResponse", redeemResponse);

      const redeemTransaction = await provider.getTransaction(redeemResponse.hash);
      console.log("redeemTransaction", redeemTransaction);

      const blockNumber = redeemTransaction?.blockNumber;
      let blockTimestamp = 0;

      if (blockNumber) {
        console.log("blockNumber", blockNumber);
        const block = await provider.getBlock(blockNumber);
        console.log("block", block);
        blockTimestamp = block.timestamp;

        wrapRequest.transactionBlockNumber = block.number;
      }

      console.log("Date.now()", Date.now());

      console.log(
        "wrapRequest before redeemDelayInSeconds update",
        Object.assign(
          {},
          {
            ...JSONbig.parse(JSONbig.stringify({ ...wrapRequest })),
          }
        )
      );

      if (wrapRequest.status == wrapRequestStatus.Redeemable) {
        wrapRequest.status = wrapRequestStatus.WaitingDelay;
        wrapRequest.timestamp = blockTimestamp;
        wrapRequest = await updateRedeemDelayAndStatus(wrapRequest);
      } else if (wrapRequest.status == wrapRequestStatus.WaitingDelay) {
        wrapRequest.status = wrapRequestStatus.PartialRedeemed;
        wrapRequest = await updateRedeemDelayAndStatus(wrapRequest);
      } else if (wrapRequest.status == wrapRequestStatus.PartialRedeemed) {
        wrapRequest.status = wrapRequestStatus.FinalRedeemed;
        wrapRequest.isActiveRequest = false;
      }
      console.log(
        "wrapRequest after redeemDelayInSeconds update",
        Object.assign(
          {},
          {
            ...JSONbig.parse(JSONbig.stringify({ ...wrapRequest })),
          }
        )
      );

      updateWrapRequestsWithNewOne(wrapRequest);
      dispatch(clearActiveWrapRequest());

      if (wrapRequest.status == wrapRequestStatus.FinalRedeemed) {
        dispatch(storeSuccessInfo(JSON.stringify(wrapRequest)));
        toast("Request fully redeemed", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });
      } else {
        const waitingMinutes = (wrapRequest.redeemDelayInSeconds || constants.wrapRedeemDelayInSeconds) / 60;
        toast(
          "Successfully redeemed 1/2. Please wait " +
            parseFloat(waitingMinutes + "").toFixed(0) +
            ` minute${waitingMinutes == 1 ? "" : "s"} to fully redeem.`,
          {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "success",
            theme: "dark",
          }
        );
      }

      return wrapRequest;
    } catch (err: any) {
      console.error(err);
      let readableError = JSON.stringify(err).toLowerCase();
      if (readableError.includes(`redeem: not redeemable yet`)) {
        readableError = "Transaction not redeemable yet.";
        wrapRequest.status = wrapRequestStatus.WaitingDelay;

        wrapRequest = await updateRedeemDelayAndStatus(wrapRequest);
        console.log(
          "(err) wrapRequest after redeemDelayInSeconds update",
          Object.assign(
            {},
            {
              ...JSONbig.parse(JSONbig.stringify({ ...wrapRequest })),
            }
          )
        );

        toast(
          "Transaction is not redeemable yet. Our estimation of block generation time wasn't accurate enough. Please try again later.",
          {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "error",
            theme: "dark",
          }
        );

        return wrapRequest;
      } else if (readableError.includes(`nonce already redeemed`)) readableError = "Transaction already redeemed.";
      else if (readableError.includes(`wrong signature`)) readableError = "Wrong transaction signature.";
      else if (readableError.includes(`user rejected transaction`) || readableError.includes("user denied transaction"))
        readableError = "You rejected the Metamask transaction.";
      else if (readableError.includes(`cannot set properties of undefined`))
        readableError = "You closed Metamask Extension too soon.";
      else if (readableError.includes(`reason string`))
        readableError = readableError?.split(`reason string '`)?.pop()?.split(`'`)[0] || "";
      else if (readableError.includes(`reason:`))
        readableError = readableError?.split(`"Reason:`)?.pop()?.split(`"`)[0] || "";
      else if (readableError.includes(`metamask tx signature: `))
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
      return wrapRequest;
    }
  };

  const updateWrapRequestsWithNewOne = (wrapRequest: WrapRequestItem) => {
    let foundItemIndex = -1;

    const localRequests = JSON.parse(localStorage.getItem("wrapRequests") || "[]");
    const oldRequestEquivalent: WrapRequestItem = localRequests.filter((req: WrapRequestItem, index: number) => {
      if (req?.id === wrapRequest?.id) {
        foundItemIndex = index;
        return true;
      }
    })[0];

    console.log("updateWrapRequestsWithNewOne - wrapRequest", { ...wrapRequest });
    console.log("foundItemIndex", foundItemIndex);
    console.log("localRequests", { ...localRequests });

    if (foundItemIndex !== -1) {
      // Whenever we change the request in frontend and we want the updates to also be applied to the localStorage
      // You need to specify which fields have been updated in the map below
      localRequests[foundItemIndex] = oldRequestEquivalent;
      localRequests[foundItemIndex].status = wrapRequest.status;
      localRequests[foundItemIndex].timestamp = wrapRequest.timestamp;
      localRequests[foundItemIndex].redeemDelayInSeconds = wrapRequest.redeemDelayInSeconds;
      localRequests[foundItemIndex].transactionHash = wrapRequest.transactionHash;
    } else {
      localRequests.push(wrapRequest);
    }
    console.log("updated localRequests", { ...localRequests });

    setRequestItems((reqItems) => {
      const curatedForSupernova = curateWrapRequestsForSupernova(reqItems);
      const newReq = curatedForSupernova.map((req: any) => {
        if (req.id === wrapRequest.id) {
          req.status = wrapRequest.status;
          req.timestamp = wrapRequest.timestamp;
          req.redeemDelayInSeconds = wrapRequest.redeemDelayInSeconds;
          req.transactionHash = wrapRequest.transactionHash;
        }
        return req;
      });
      saveWrapRequestsToLocalStorage(newReq);
      return newReq;
    });
  };

  const onItemRedeem = async (wrapRequest: WrapRequestItem) => {
    console.log(
      "onItemRedeem - wrapRequest",
      Object.assign(
        {},
        {
          ...JSONbig.parse(JSONbig.stringify({ ...wrapRequest })),
        }
      )
    );

    const request = await redeemRequest(wrapRequest);

    console.log("Request after onItemRedeem", JSONbig.parse(JSONbig.stringify(wrapRequest)));
    // Save new version of request
    updateWrapRequestsWithNewOne(request);

    if (request.status == wrapRequestStatus.FinalRedeemed) {
      onStepSubmit();
    } else {
    }
  };

  const changePage = (toPage: number) => {
    setCurrentPage(toPage);
  };

  const goToNewSwap = () => {
    dispatch(storeCurrentWizardFlowStep(2));
  };

  return (
    <>
      <div className="mt-4" id="requests-list-root">
        {requestItems.length > 0 && !isLoading
          ? requestItems.map((requestItem, i) => {
              return (
                <WrapRequestItemComponent
                  currentChainId={metamaskChainId}
                  key={"request-item-" + requestItem.id + requestItem.toAddress + i}
                  onRedeem={onItemRedeem}
                  originalRequestItem={requestItem}></WrapRequestItemComponent>
              );
            })
          : !isLoading && (
              <div className="w-100 d-flex align-items-center flex-columns mt-5">
                <h4 className="text-gray text-center">
                  {`You have no wrap requests yet.`}
                  <br></br>
                  <br></br>
                  {`If you've created a Wrap Request in the past 30 minutes and it's missing, it is probably still confirming on the Ethereum network or being signed by the bridge. This can sometimes take longer than 30 minutes, so please be patient or reach out on Telegram for support.`}
                </h4>

                <div className="d-flex align-items-center justify-items-center gap-2">
                  <a href="https://twitter.com/LearnZenon" target="_blank" rel="noreferrer" className="tooltip">
                    <img alt="twitter support" className="cursor-pointer" height={52} src={twitterLogo}></img>
                    <span className="tooltip-text">Twitter</span>
                  </a>
                  <a href=" https://t.me/zenonnetwork" target="_blank" rel="noreferrer" className="tooltip">
                    <img alt="telegram support" className="cursor-pointer" height={52} src={telegramLogo}></img>
                    <span className="tooltip-text">Telegram</span>
                  </a>
                  <a href="https://forum.zenon.org" target="_blank" rel="noreferrer" className="tooltip">
                    <img alt="forum support" className="cursor-pointer" height={52} src={forumLogo}></img>
                    <span className="tooltip-text">Forum</span>
                  </a>
                  <a
                    href="https://discord.com/invite/zenonnetwork"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip">
                    <img alt="discord support" className="cursor-pointer" height={52} src={discordLogo}></img>
                    <span className="tooltip-text">Discord</span>
                  </a>
                </div>

                <div className="mt-5" style={{ width: "220px" }} onClick={() => goToNewSwap()} tabIndex={0}>
                  <NavMenuButton content="Make a swap" link="" isActive={false} icon={newSwapIcon}></NavMenuButton>
                </div>
              </div>
            )}
      </div>
      <div className={`${maxPages > 1 ? "" : "invisible-no-interaction"}`}>
        <Paginator
          maxPages={maxPages}
          currentPage={currentPage}
          onPageClick={(toPage) => changePage(toPage)}></Paginator>
      </div>
    </>
  );
};

export default WrapRequestsList;
