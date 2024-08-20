import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Primitives, Zenon } from "znn-ts-sdk";
import NavMenuButton from "../../../components/nav-menu-button/nav-menu-button";
import Paginator from "../../../components/paginator/paginator";
import UnwrapRequestItemComponent from "../../../components/unwrapRequestItemComponent/unwrapRequestItemComponent";
import { UnwrapRequestItem, unwrapRequestStatus } from "../../../models/unwrapRequestItem";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import useInternalNetwork from "../../../services/hooks/internalNetwork-provider/useInternalNetwork";
import { clearActiveUnwrapRequest, storeSuccessInfo } from "../../../services/redux/requestsSlice";
import { storeCurrentWizardFlowStep, swapFlowSteps } from "../../../services/redux/wizardStatusSlice";
import { simpleNetworkType, simpleTokenType } from "../swapStep/swapStep";
import newSwapSvg from "./../../../assets/icons/swap.svg";
import discordLogo from "./../../../assets/logos/discord-logo.svg";
import forumLogo from "./../../../assets/logos/forum-logo.svg";
import telegramLogo from "./../../../assets/logos/telegram.svg";
import twitterLogo from "./../../../assets/logos/twitter.svg";
import useExternalNetwork from "../../../services/hooks/externalNetwork-provider/useExternalNetwork";
import { curateUnwrapRequestsForSupernova, getUnwrapRequestsAndEmulatePagination } from "../../../utils/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const UnwrapRequestsList = ({ onStepSubmit = () => {} }) => {
  const newSwapIcon = <img alt="" className="" height="15px" src={newSwapSvg} />;
  const storedRequests = useSelector((state: any) => state.requests);
  const walletInfo = useSelector((state: any) => state.wallet);
  const [requestItems, setRequestItems] = useState<Array<UnwrapRequestItem>>([]);
  const [maxPages, setMaxPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const dispatch = useDispatch();
  const { handleSpinner } = useContext(SpinnerContext);
  const itemsPerPage = 10;
  const interval = useRef<any>();
  const [isLoading, setIsLoading] = useState(false);
  const globalConstants = useSelector((state: any) => state.globalConstants);
  const refreshInterval = 30000;
  const { internalNetworkClient } = useInternalNetwork();
  const { externalNetworkClient } = useExternalNetwork();

  useEffect(() => {
    getRequests(currentPage, itemsPerPage);
    interval.current = setInterval(getRequests, refreshInterval);

    return () => {
      clearInterval(interval.current);
    };
  }, [walletInfo.zenonInfo]);

  useEffect(() => {
    clearInterval(interval.current);
    interval.current = setInterval(getRequests, refreshInterval);

    return () => clearInterval(interval.current);
  }, [currentPage]);

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

      let activeRequest = JSON.parse(storedRequests.activeUnwrapRequest || "{}");
      console.log("Active request", activeRequest);

      const zenonInfo = JSON.parse(walletInfo.zenonInfo || "{}");
      const toAddress = zenonInfo?.address;

      console.log("toAddress", toAddress);
      console.log("_currentPage", _currentPage);
      console.log("_itemsPerPage", _itemsPerPage);
      let getAllUnwrapTokenRequestsByToAddress = {
        count: 0,
        list: [],
      };
      if (toAddress) {
        // if (globalConstants?.isSupernovaNetwork) {
        //   getAllUnwrapTokenRequestsByToAddress =
        //     await zenon.embedded.bridge.getAllUnwrapTokenRequestsByToAddressNetworkClassAndChainId(
        //       toAddress,
        //       globalConstants?.externalAvailableNetworks.find((n: simpleNetworkType) => n.isAvailable)?.networkClass,
        //       parseInt(globalConstants?.supernovaChainId?.toString()),
        //       _currentPage,
        //       _itemsPerPage
        //     );
        // } else {
        // getAllUnwrapTokenRequestsByToAddress = await zenon.embedded.bridge.getAllUnwrapTokenRequestsByToAddress(
        //   toAddress,
        //   _currentPage,
        //   _itemsPerPage
        // );
        // }

        getAllUnwrapTokenRequestsByToAddress = await getUnwrapRequestsAndEmulatePagination(
          zenon,
          toAddress,
          _currentPage,
          _itemsPerPage
        );
      }

      setMaxPages(Math.ceil(getAllUnwrapTokenRequestsByToAddress.count / _itemsPerPage));
      console.log("getAllUnwrapTokenRequestsByToAddress", { ...getAllUnwrapTokenRequestsByToAddress });
      console.log(
        "JSONbig.parse(JSONbig.stringify(getAllUnwrapTokenRequestsByToAddress))",
        JSONbig.parse(JSONbig.stringify(getAllUnwrapTokenRequestsByToAddress))
      );
      console.log(
        "JSONbig.stringify(getAllUnwrapTokenRequestsByToAddress)",
        JSONbig.stringify(getAllUnwrapTokenRequestsByToAddress)
      );

      const transformedUnwrapRequests = await Promise.all(
        getAllUnwrapTokenRequestsByToAddress.list.map(transformUnwrapRequest)
      );
      console.log("transformedUnwrapRequests", transformedUnwrapRequests);

      const oldRequests = JSON.parse(localStorage.getItem("unwrapRequests") || "[]").map((req: any) =>
        UnwrapRequestItem.fromJson(req)
      );
      console.log("oldRequests", oldRequests);
      const newRequests = transformedUnwrapRequests.map((req: any) => UnwrapRequestItem.fromJson(req));
      console.log("newRequests", newRequests);

      // Only add the active request on the first page
      if (_currentPage !== 0) {
        activeRequest = storedRequests.emptyUnwrapRequest;
      }

      const mergedUnwrapRequests = mergeAndSortUnwrapRequests(oldRequests, newRequests, activeRequest);
      saveUnwrapRequestsToLocalStorage(mergedUnwrapRequests, oldRequests);
      console.log("mergedUnwrapRequests", mergedUnwrapRequests);

      const curatedForSupernova = curateUnwrapRequestsForSupernova(mergedUnwrapRequests);
      setRequestItems(curatedForSupernova);
    } catch (err) {
      console.error(err);
    } finally {
      showSpinner(false);
      setIsLoading(false);
    }
  };

  const transformUnwrapRequest = async (request: { [key: string]: any }) => {
    console.log("transformUnwrapRequest, request", request);
    request.fromToken = globalConstants.externalAvailableTokens.find(
      (tok: simpleTokenType) =>
        tok.address?.toLowerCase() == request.tokenAddress?.toLowerCase() && tok.network.chainId == request?.chainId
    );

    request.toToken = {
      symbol: request.token?.symbol,
      address: request.token?.tokenStandard.toString(),
      decimals: request.token?.decimals,
      ...globalConstants.internalAvailableTokens.find(
        (tok: simpleTokenType) => tok.address?.toLowerCase() == request.token.tokenStandard?.toLowerCase()
      ),
    };

    if (request.logIndex < globalConstants.maxLogIndex) {
      const provider = await externalNetworkClient.getProvider();
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("request.transactionHash", request.transactionHash);

      const evmTransaction = await provider.getTransaction("0x" + request.transactionHash);
      if (evmTransaction) {
        console.log("evmTransaction", evmTransaction);

        const iface = new ethers.utils.Interface(globalConstants.abiContract);
        let amountForBeingReferred = 0;
        try {
          amountForBeingReferred = iface.decodeFunctionData("unwrap", evmTransaction?.data)[1];
        } catch (err) {
          console.error(err);
        }
        const parsedAmount = ethers.utils.formatUnits(amountForBeingReferred, request.token?.decimals);

        console.log("amountForBeingReferred", amountForBeingReferred);
        console.log("parsedAmount", parsedAmount);

        request.originalAmount = amountForBeingReferred.toString();
        request.amount = request.amount.toString();
      }
    } else {
      console.log("evmTransaction not found");
      request.amount = request.amount.toString();
    }

    request.amount = request.amount.toString();
    request.token.maxSupply = request?.token?.maxSupply.toString();
    request.token.totalSupply = request?.token?.totalSupply.toString();

    console.log("request", request);
    const reqItem = UnwrapRequestItem.fromJson(request);
    console.log("reqItem", reqItem);

    if (!request?.signature.length) {
      reqItem.status = unwrapRequestStatus.Signing;
    } else {
      if (request?.redeemableIn > 0) {
        reqItem.status = unwrapRequestStatus.WaitingConfirmation;
        console.log("resetting timestamp", reqItem.timestamp);
      } else {
        if (request?.redeemableIn == 0) {
          reqItem.status = unwrapRequestStatus.Redeemable;
        } else {
          reqItem.status = unwrapRequestStatus.Broken;
        }
      }
    }

    if (request?.redeemed) {
      reqItem.status = unwrapRequestStatus.Redeemed;
    } else if (request?.revoked) {
      reqItem.status = unwrapRequestStatus.Revoked;
    }

    if (!reqItem.status) {
      reqItem.status = unwrapRequestStatus.Redeemable;
    }

    console.log("isFromAffiliation - logIndex", reqItem?.logIndex);
    if ((reqItem?.logIndex || 0) >= globalConstants.maxLogIndex) {
      reqItem.isFromAffiliation = true;
    } else {
      reqItem.isFromAffiliation = false;
    }

    return reqItem;
  };

  const mergeAndSortUnwrapRequests = (
    oldRequests: Array<UnwrapRequestItem>,
    newRequests: Array<UnwrapRequestItem>,
    activeRequest: UnwrapRequestItem
  ): Array<UnwrapRequestItem> => {
    let isActiveRequestInList = false;
    const mergedRequests: Array<UnwrapRequestItem> = newRequests.map((request: UnwrapRequestItem) => {
      const oldRequestEquivalent = oldRequests.filter((req: UnwrapRequestItem) => {
        return req?.transactionHash === request?.transactionHash && req?.logIndex === request?.logIndex;
      })[0];

      if (oldRequestEquivalent) {
        //
        // When UnwrapRequestItem model changes, you need to update here
        // so that the new fields from the RPC are added to the objects
        //
        oldRequestEquivalent.signature = request.signature;
        oldRequestEquivalent.redeemableIn = request.redeemableIn;
        oldRequestEquivalent.logIndex = request.logIndex;
        oldRequestEquivalent.isFromAffiliation = request.isFromAffiliation;

        if (
          (!oldRequestEquivalent.status || oldRequestEquivalent.status == unwrapRequestStatus.Signing) &&
          (request?.signature?.length || 0) > 0
        ) {
          // unwrapRequestStatus.WaitingConfirmation is the first status after coming form RPC
          oldRequestEquivalent.status = unwrapRequestStatus.WaitingConfirmation;
        } else if (request.status) {
          oldRequestEquivalent.status = request.status;
        }

        Object.assign(request, oldRequestEquivalent);
      }

      if (request.transactionHash === activeRequest.transactionHash) {
        request.isActiveRequest = true;
        isActiveRequestInList = true;
      }
      return request;
    });

    if (!isActiveRequestInList && (activeRequest?.toAddress?.length || 0) > 0) {
      mergedRequests.push(activeRequest);
      // dispatch(clearActiveUnwrapRequest());
    }
    console.log(
      "mergedRequests",
      mergedRequests.sort((a: UnwrapRequestItem, b: UnwrapRequestItem) => (b.timestamp || 0) - (a.timestamp || 0))
    );
    return mergedRequests.sort((a: UnwrapRequestItem, b: UnwrapRequestItem) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  const saveUnwrapRequestsToLocalStorage = (
    newRequests: Array<UnwrapRequestItem>,
    oldRequests: Array<UnwrapRequestItem> = []
  ) => {
    if (oldRequests.length == 0) {
      oldRequests = JSON.parse(localStorage.getItem("unwrapRequests") || "[]").map((req: any) =>
        UnwrapRequestItem.fromJson(req)
      );
    }

    newRequests.map((request: UnwrapRequestItem) => {
      let foundIndex = -1;
      foundIndex = oldRequests.findIndex((req) => req?.transactionHash === request?.transactionHash);

      if (foundIndex != -1) {
        oldRequests[foundIndex] = request;
      } else {
        oldRequests.push(request);
      }
    });

    localStorage.setItem("unwrapRequests", JSON.stringify(oldRequests));
    return oldRequests;
  };

  const redeemRequest = async (unwrapRequest: UnwrapRequestItem) => {
    return new Promise(async (resolve, reject) => {
      console.log("Redeeming ", unwrapRequest);
      try {
        const zenon = Zenon.getSingleton();
        const tokenStandard = Primitives.TokenStandard.parse(unwrapRequest.toToken?.address || "");
        const trHash = Primitives.Hash.parse(unwrapRequest?.transactionHash || "");
        const logIndex = unwrapRequest.logIndex || 0;

        const unwrap = zenon.embedded.bridge.redeem(trHash, tokenStandard, logIndex);
        console.log("unwrap", unwrap);

        const transaction = {
          fromAddress: JSONbig.parse(walletInfo.zenonInfo || "{}")?.address,
          accountBlock: unwrap.toJson(),
        };

        const accountBlock = await internalNetworkClient.sendTransaction(transaction);
        console.log("final accountBlock", accountBlock);

        const hash = accountBlock?.hash.toString();

        //
        // Update redeemDelay of request
        //
        const redeemDelay = globalConstants.tokenPairs.find(
          (pair: any) =>
            pair.internalToken.address?.toLowerCase() == unwrapRequest.toToken?.address?.toLowerCase() &&
            pair.externalToken.address?.toLowerCase() == unwrapRequest.fromToken?.address?.toLowerCase()
        )?.unwrapRedeemDelay;
        console.log("__unwrap__redeemDelay", redeemDelay);
        const redeemDelayInSeconds = redeemDelay * globalConstants.estimatedMomentumTimeInSeconds;
        console.log("__unwrap__redeemDelayInSeconds", redeemDelayInSeconds);
        unwrapRequest.redeemDelayInSeconds = redeemDelayInSeconds;

        if (unwrapRequest.status == unwrapRequestStatus.Redeemable) {
          unwrapRequest.status = unwrapRequestStatus.Redeemed;
          unwrapRequest.isActiveRequest = false;
        }
        unwrapRequest.id = hash;

        updateUnwrapRequestsWithNewOne(unwrapRequest);
        dispatch(clearActiveUnwrapRequest());

        console.log("storeSuccess, unwrapRequest", unwrapRequest);
        if (unwrapRequest.status == unwrapRequestStatus.Redeemed) {
          dispatch(storeSuccessInfo(JSON.stringify(unwrapRequest)));
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
          resolve(unwrapRequestStatus.Redeemed);
        } else {
          toast("Error redeeming", {
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
      } catch (err: any) {
        console.error(err);
        let readableError = JSON.stringify(err).toLowerCase();

        if (readableError.includes(`wrong signature`)) readableError = "Wrong transaction signature.";
        else if (
          readableError.includes(`user rejected transaction`) ||
          readableError.includes("user denied transaction")
        )
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
        return {};
      }
    });
  };

  const updateUnwrapRequestsWithNewOne = (unwrapRequest: UnwrapRequestItem) => {
    let foundItemIndex = -1;
    const currentRequests = JSON.parse(localStorage.getItem("unwrapRequests") || "[]");
    const oldRequestEquivalent: UnwrapRequestItem = currentRequests.filter((req: UnwrapRequestItem, index: number) => {
      if (req?.transactionHash === unwrapRequest?.transactionHash) {
        foundItemIndex = index;
        return true;
      }
    })[0];
    if (foundItemIndex !== -1) {
      currentRequests[foundItemIndex] = oldRequestEquivalent;
      currentRequests[foundItemIndex].status = unwrapRequest.status;
      currentRequests[foundItemIndex].id = unwrapRequest.id;
    } else {
      currentRequests.push(unwrapRequest);
    }

    saveUnwrapRequestsToLocalStorage(currentRequests);
    setRequestItems((currValues: UnwrapRequestItem[]) => {
      const curatedForSupernova = curateUnwrapRequestsForSupernova(currValues);
      return curatedForSupernova.map((item: UnwrapRequestItem) => {
        if (item?.transactionHash == unwrapRequest?.transactionHash) {
          item = unwrapRequest;
        }
        return item;
      });
    });
  };

  const onItemRedeem = async (unwrapRequest: UnwrapRequestItem) => {
    const redeemStatus = await redeemRequest(unwrapRequest);

    if (redeemStatus == unwrapRequestStatus.Redeemed) {
      onStepSubmit();
    }
  };

  const changePage = (toPage: number) => {
    getRequests(toPage, itemsPerPage);
    setCurrentPage(toPage);
  };

  const goToNewSwap = () => {
    dispatch(storeCurrentWizardFlowStep(swapFlowSteps.Swap));
  };

  return (
    <>
      <div className="mt-4" id="requests-list-root">
        {/* <div style={{position: 'sticky'}}></div> */}
        {requestItems.length > 0
          ? requestItems.map((requestItem, i) => {
              return (
                <UnwrapRequestItemComponent
                  key={"request-item-" + requestItem.transactionHash + requestItem.toAddress + i}
                  onRedeem={onItemRedeem}
                  requestItem={requestItem}></UnwrapRequestItemComponent>
              );
            })
          : !isLoading && (
              <div className="w-100 d-flex align-items-center flex-columns mt-5">
                <h4 className="text-gray text-center">
                  <h4 className="text-gray text-center">
                    {`You have no unwrap requests yet.`}
                    <br></br>
                    <br></br>
                    {`If you've created an Unwrap Request in the past 30 minutes and it's missing, it is probably still confirming on the Ethereum network or being signed by the bridge. This can sometimes take longer than 30 minutes, so please be patient or reach out on Telegram for support.`}
                  </h4>
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

export default UnwrapRequestsList;
