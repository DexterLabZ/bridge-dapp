import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Primitives, Zenon } from "znn-ts-sdk";
import NavMenuButton from "../../../components/nav-menu-button/nav-menu-button";
import Paginator from "../../../components/paginator/paginator";
import StakingEntryComponent from "../../../components/stakingEntryComponent/stakingEntryComponent";
import { LiquidityStakingItem, liquidityStakingStatus } from "../../../models/LiquidityStakingItem";
import { SimpleToken } from "../../../models/SimpleToken";
import { SpinnerContext } from "../../../services/hooks/spinner/spinnerContext";
import useZenon from "../../../services/hooks/zenon-provider/useZenon";
import { clearActiveStakingEntry } from "../../../services/redux/liquidityStakingEntriesSlice";
import { liquidityFlowSteps, storeCurrentWizardFlowStep } from "../../../services/redux/wizardStatusSlice";
import newSwapSvg from "./../../../assets/icons/swap.svg";
import "./liquidityStakingHistoryStep.scss";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const LiquidityStakingHistoryStep = ({ onStepSubmit = () => {} }) => {
  const newSwapIcon = <img alt="" className="" height="15px" src={newSwapSvg} />;
  const [maxPages, setMaxPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const dispatch = useDispatch();
  const { handleSpinner } = useContext(SpinnerContext);
  const itemsPerPage = 5;
  const interval = useRef<any>();
  const [isLoading, setIsLoading] = useState(false);
  const globalConstants = useSelector((state: any) => state.globalConstants);
  const refreshInterval = 30000;
  const [stakingItems, setLiquidityStakingItems] = useState<Array<LiquidityStakingItem>>([]);
  const storedLiquidityStakingItems = useSelector((state: any) => state.liquidityStakingEntries);
  const walletInfo = useSelector((state: any) => state.wallet);
  const zenon = Zenon.getSingleton();
  const [uncollectedReward, setUncollectedReward] = useState<{ [key: string]: string | boolean }>({
    hasRewards: false,
    qsrAmount: "",
    znnAmount: "",
  });
  const { zenonClient } = useZenon();

  useEffect(() => {
    getLiquidityStakingItems(currentPage, itemsPerPage);
    interval.current = setInterval(getLiquidityStakingItems, refreshInterval);

    return () => {
      clearInterval(interval.current);
    };
  }, []);

  useEffect(() => {
    clearInterval(interval.current);
    interval.current = setInterval(getLiquidityStakingItems, refreshInterval);

    return () => clearInterval(interval.current);
  }, [currentPage]);

  const getLiquidityStakingItems = async (_currentPage: number = currentPage, _itemsPerPage: number = itemsPerPage) => {
    setIsLoading(true);
    const showSpinner = handleSpinner(
      <>
        <div className="text-bold">Getting requests ...</div>
      </>,
      "requests-list-root"
    );
    try {
      showSpinner(true);

      console.log("storedLiquidityStakingItems.activeStakingEntry", storedLiquidityStakingItems.activeStakingEntry);

      let activeRequest = storedLiquidityStakingItems.activeStakingEntry
        ? JSONbig.parse(storedLiquidityStakingItems.activeStakingEntry)
        : undefined;

      console.log("Active request", activeRequest);

      let stakeAddress;

      if (activeRequest) {
        stakeAddress = Primitives.Address.parse(activeRequest?.stakeAddress);
        // Only add the active request on the first page
        if (_currentPage !== 0) {
          activeRequest = undefined;
        } else {
          activeRequest = LiquidityStakingItem.fromJson(activeRequest);
        }
      } else {
        const zenonInfo = JSONbig.parse(walletInfo.zenonInfo || "{}");
        stakeAddress = Primitives.Address.parse(zenonInfo?.address);
      }

      console.log("stakeAddress", stakeAddress);

      let getLiquidityStakeEntriesByAddress: any = {
        count: 0,
        list: [],
        totalAmount: 0,
        totalWeightedAmount: 0,
      };
      if (stakeAddress) {
        getLiquidityStakeEntriesByAddress = await zenon.embedded.liquidity.getLiquidityStakeEntriesByAddress(
          stakeAddress,
          _currentPage,
          _itemsPerPage
        );
      }

      setMaxPages(Math.ceil(getLiquidityStakeEntriesByAddress.count / _itemsPerPage));

      console.log("getLiquidityStakeEntriesByAddress", { ...getLiquidityStakeEntriesByAddress });
      console.log(
        "JSONbig.stringify(getLiquidityStakeEntriesByAddress)",
        JSONbig.parse(JSONbig.stringify(getLiquidityStakeEntriesByAddress))
      );

      const transformedStakeEntries: LiquidityStakingItem[] =
        getLiquidityStakeEntriesByAddress.list.map(transformLiquidityStakingItem);
      console.log("transformedStakeEntries", JSONbig.parse(JSONbig.stringify(transformedStakeEntries)));

      const oldRequests = JSONbig.parse(localStorage.getItem("stakeEntries") || "[]").map((req: any) =>
        LiquidityStakingItem.fromJson(req)
      );

      console.log("oldRequests", JSONbig.parse(JSONbig.stringify(oldRequests)));

      const mergedStakeEntries = mergeAndSortStakeEntries(oldRequests, transformedStakeEntries, activeRequest);
      saveStakeEntriesToLocalStorage(mergedStakeEntries, oldRequests);

      console.log("mergedStakeEntries", JSONbig.parse(JSONbig.stringify(mergedStakeEntries)));

      await getRewardsDetails(stakeAddress);

      setLiquidityStakingItems(mergedStakeEntries);
    } catch (err) {
      console.error(err);
    } finally {
      showSpinner(false);
      setIsLoading(false);
    }
  };

  const transformLiquidityStakingItem = (request: { [key: string]: any }) => {
    request.stakeAddress = request.stakeAddress.toString();
    request.id = request.id.toString();
    console.log("transformLiquidityStakingItem, request", JSONbig.parse(JSONbig.stringify(request)));

    const reqItem = LiquidityStakingItem.fromJson(request);
    reqItem.token = globalConstants.liquidityTokenTuples.find((tok: any) => tok.tokenStandard == reqItem.tokenStandard);

    console.log("reqItem", JSONbig.parse(JSONbig.stringify(reqItem)));

    reqItem.token = SimpleToken.fromJson(reqItem.token as unknown as { [key: string]: any });

    console.log("reqItem", JSONbig.parse(JSONbig.stringify(reqItem)));
    return reqItem;
  };

  const mergeAndSortStakeEntries = (
    oldRequests: Array<LiquidityStakingItem>,
    newRequests: Array<LiquidityStakingItem>,
    activeRequest: LiquidityStakingItem | undefined
  ): Array<LiquidityStakingItem> => {
    let isActiveRequestInList = false;
    const mergedRequests: Array<LiquidityStakingItem> = newRequests.map((request: LiquidityStakingItem) => {
      const oldRequestEquivalent: LiquidityStakingItem | undefined = oldRequests.filter((req: LiquidityStakingItem) => {
        return req?.id?.toString() === request?.id?.toString();
      })?.[0];

      if (oldRequestEquivalent) {
        // By default the request data is retrieved from localStorage.
        // If you want to update a specific field from the RPC, please define it here

        // Timestamp when transaction was revoked
        oldRequestEquivalent.revokeTime = request.revokeTime;
        // Timestamp when staking will expire (will be able to cancel)
        oldRequestEquivalent.expirationTime = request.expirationTime;
        // Time when transaction started
        oldRequestEquivalent.startTime = request.startTime;
        oldRequestEquivalent.token = request.token;
        oldRequestEquivalent.amount = request.amount;
        oldRequestEquivalent.weightedAmount = request.weightedAmount;

        if (!oldRequestEquivalent?.status) {
          oldRequestEquivalent.status = liquidityStakingStatus.Pending;
        } else {
          if (!request.revokeTime) {
            oldRequestEquivalent.isActiveRequest = false;

            if (request.expirationTime > Date.now() / 1000) {
              // Still need to wait before being able to cancel/revoke
              oldRequestEquivalent.status = liquidityStakingStatus.Waiting;
            } else {
              // Can be revoked
              oldRequestEquivalent.status = liquidityStakingStatus.Revokable;
            }
          } else {
            oldRequestEquivalent.status = liquidityStakingStatus.Revoked;
          }
        }

        if (request.revokeTime > 0) storedLiquidityStakingItems.activeStakingEntry = liquidityStakingStatus.Revoked;

        Object.assign(request, oldRequestEquivalent);
      }

      if (request.id.toString() === activeRequest?.id?.toString()) {
        request.isActiveRequest = true;
        isActiveRequestInList = true;
      }
      return request;
    });

    if (!isActiveRequestInList && activeRequest?.amount) {
      mergedRequests.push(activeRequest);
    }
    console.log(
      "mergedRequests",
      mergedRequests.sort((a: LiquidityStakingItem, b: LiquidityStakingItem) => (b.timestamp || 0) - (a.timestamp || 0))
    );
    return mergedRequests.sort(
      (a: LiquidityStakingItem, b: LiquidityStakingItem) => (b.timestamp || 0) - (a.timestamp || 0)
    );
  };

  const saveStakeEntriesToLocalStorage = (
    newRequests: Array<LiquidityStakingItem>,
    oldRequests: Array<LiquidityStakingItem> = []
  ) => {
    if (oldRequests.length == 0) {
      oldRequests = JSONbig.parse(localStorage.getItem("stakeEntries") || "[]").map((req: any) =>
        LiquidityStakingItem.fromJson(req)
      );
    }

    newRequests.map((request: LiquidityStakingItem) => {
      let foundIndex = -1;
      foundIndex = oldRequests.findIndex((req) => req?.id.toString() === request?.id.toString());

      if (foundIndex != -1) {
        oldRequests[foundIndex] = request;
      } else {
        oldRequests.push(request);
      }
    });

    console.log("oldRequests", oldRequests);
    const jsonRequests = oldRequests.map((en) => en.toJson());
    console.log("jsonRequests", jsonRequests);

    localStorage.setItem("stakeEntries", JSON.stringify(jsonRequests));
    return jsonRequests;
  };

  const getRewardsDetails = async (stakeAddress: any) => {
    const uncollectedReward = await zenon.embedded.liquidity.getUncollectedReward(stakeAddress);
    console.log("uncollectedReward", uncollectedReward);
    console.log("globalConstants", globalConstants);
    const znnDecimals = globalConstants.internalAvailableTokens.find(
      (tok: any) => tok.address?.toLowerCase() == globalConstants.znnTokenInfo?.toLowerCase()
    ).decimals;
    const qsrDecimals = globalConstants.internalAvailableTokens.find(
      (tok: any) => tok.address?.toLowerCase() == globalConstants.qsrTokenInfo?.toLowerCase()
    ).decimals;

    const znnAmount = ethers.utils.formatUnits(
      uncollectedReward.znnAmount + "",
      ethers.BigNumber.from((znnDecimals || 8) + "")
    );
    const qsrAmount = ethers.utils.formatUnits(
      uncollectedReward.qsrAmount + "",
      ethers.BigNumber.from((qsrDecimals || 8) + "")
    );

    if (
      ethers.BigNumber.from(uncollectedReward.znnAmount).gt(0) ||
      ethers.BigNumber.from(uncollectedReward.qsrAmount).gt(0)
    ) {
      setUncollectedReward({
        hasRewards: true,
        znnAmount: znnAmount,
        qsrAmount: qsrAmount,
      });
    } else {
      setUncollectedReward({
        hasRewards: false,
        znnAmount: "",
        qsrAmount: "",
      });
    }
    return uncollectedReward;
  };

  const changePage = (toPage: number) => {
    getLiquidityStakingItems(toPage, itemsPerPage);
    setCurrentPage(toPage);
  };

  const goToNewStaking = () => {
    dispatch(storeCurrentWizardFlowStep(liquidityFlowSteps.Staking));
  };

  const onItemRevoke = async (stakingRequest: LiquidityStakingItem) => {
    console.log("onItemRevoke", stakingRequest);
    const redeemStatus = await revokeRequest(stakingRequest);

    if (redeemStatus == liquidityStakingStatus.Revoked) {
      console.log("On step finished");
    } else {
      console.log("Final step", redeemStatus);
    }
  };

  const collectRewards = async () => {
    return new Promise(async (resolve, reject) => {
      console.log("collectRewards - uncollectedReward", uncollectedReward);
      try {
        const zenon = Zenon.getSingleton();

        const collectReward = zenon.embedded.liquidity.collectReward();
        console.log("collectReward", collectReward);

        const transaction = {
          fromAddress: JSONbig.parse(walletInfo.zenonInfo || "{}")?.address,
          accountBlock: collectReward.toJson(),
        };

        const accountBlock = await zenonClient.sendTransaction(transaction);

        console.log("final accountBlock", accountBlock);

        const hash = accountBlock?.hash.toString();

        console.log("When resolve after collect rewards", hash);

        setUncollectedReward({
          hasRewards: false,
          qsrAmount: "",
          znnAmount: "",
        });

        toast("Collected all rewards", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });

        resolve(hash);
      } catch (err: any) {
        console.error(err);
        const readableError = JSON.stringify(err).toLowerCase();

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
        reject(err);
        return {};
      }
    });
  };

  const revokeRequest = async (stakingRequest: LiquidityStakingItem) => {
    return new Promise(async (resolve, reject) => {
      console.log("Redeeming ", stakingRequest);
      try {
        const zenon = Zenon.getSingleton();
        const trHash = Primitives.Hash.parse(stakingRequest?.id.toString() || "");

        const cancelLiquidityStake = zenon.embedded.liquidity.cancelLiquidityStake(trHash);
        console.log("cancelLiquidityStake", cancelLiquidityStake);

        const transaction = {
          fromAddress: JSONbig.parse(walletInfo.zenonInfo || "{}")?.address,
          accountBlock: cancelLiquidityStake.toJson(),
        };

        const accountBlock = await zenonClient.sendTransaction(transaction);
        console.log("final accountBlock", accountBlock);

        const hash = accountBlock?.hash.toString();

        console.log("When resolve after revoke", hash);
        if (stakingRequest.status == liquidityStakingStatus.Revokable) {
          stakingRequest.status = liquidityStakingStatus.Revoked;
          stakingRequest.isActiveRequest = false;
        }
        updateUnwrapRequestsWithNewOne(stakingRequest);
        dispatch(clearActiveStakingEntry());

        console.log("storeSuccess, stakingRequest", stakingRequest);
        if (stakingRequest.status == liquidityStakingStatus.Revoked) {
          toast("Request fully revoked", {
            position: "bottom-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            type: "success",
            theme: "dark",
          });
          resolve(liquidityStakingStatus.Revoked);
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
        const readableError = JSON.stringify(err).toLowerCase();

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

  const updateUnwrapRequestsWithNewOne = (stakingRequest: LiquidityStakingItem) => {
    let foundItemIndex = -1;
    const currentRequests = JSON.parse(localStorage.getItem("stakeEntries") || "[]").map((req: any) =>
      LiquidityStakingItem.fromJson(req)
    );
    const oldRequestEquivalent: LiquidityStakingItem = currentRequests.filter(
      (req: LiquidityStakingItem, index: number) => {
        if (req?.id.toString() === stakingRequest?.id.toString()) {
          foundItemIndex = index;
          return true;
        }
      }
    )[0];

    if (foundItemIndex !== -1) {
      currentRequests[foundItemIndex] = oldRequestEquivalent;
      currentRequests[foundItemIndex].status = stakingRequest.status;
    } else {
      currentRequests.push(stakingRequest);
    }

    saveStakingRequestsToLocalStorage(currentRequests);
    setLiquidityStakingItems((currValues: LiquidityStakingItem[]) => {
      return currValues.map((item: LiquidityStakingItem) => {
        if (item?.id?.toString() == stakingRequest?.id?.toString()) {
          item = stakingRequest;
        }
        return item;
      });
    });
  };

  const saveStakingRequestsToLocalStorage = (
    newRequests: Array<LiquidityStakingItem>,
    oldRequests: Array<LiquidityStakingItem> = []
  ) => {
    if (oldRequests.length == 0) {
      oldRequests = JSON.parse(localStorage.getItem("stakeEntries") || "[]").map((req: any) =>
        LiquidityStakingItem.fromJson(req)
      );
    }

    newRequests.map((request: LiquidityStakingItem) => {
      let foundIndex = -1;
      foundIndex = oldRequests.findIndex((req) => req?.id.toString() === request?.id.toString());

      if (foundIndex != -1) {
        oldRequests[foundIndex] = request;
      } else {
        oldRequests.push(request);
      }
    });

    const jsonRequests = oldRequests.map((en) => en.toJson());
    console.log("jsonRequests", jsonRequests);

    localStorage.setItem("stakeEntries", JSON.stringify(jsonRequests));
    return oldRequests;
  };

  return (
    <>
      <div className="mt-4" id="requests-list-root">
        <div className={`collectableRewardsCard mb-2 ${uncollectedReward.hasRewards ? "has-rewards" : ""}`}>
          {uncollectedReward.hasRewards == true ? (
            <>
              <span className="rewards-icon">🎉</span>
              <div className="tooltip">
                <span className="text-primary text-bold">
                  {parseFloat(uncollectedReward?.znnAmount.toString())?.toFixed(2)} ZNN
                </span>
                <span className="tooltip-text">{`${uncollectedReward?.znnAmount} ZNN`}</span>
              </div>
              <span className="text-bold">{` + `}</span>
              <div className="tooltip">
                <span className="text-blue text-bold">
                  {parseFloat(uncollectedReward?.qsrAmount?.toString()).toFixed(2)} QSR
                </span>
                <span className="tooltip-text">{`${uncollectedReward?.qsrAmount} QSR`}</span>
              </div>
              <span> to be collected</span>
              <div className="button primary rewards-button pr-5 pl-5" onClick={() => collectRewards()}>
                <div>
                  Collect<br></br>rewards
                </div>
              </div>
            </>
          ) : (
            <>
              <span className="text-md text-gray text-bold">No rewards to be collected yet</span>
            </>
          )}
        </div>
        <h4>Liquidity stake requests</h4>
        {stakingItems.length > 0
          ? stakingItems.map((stakingItem, i) => {
              return (
                <StakingEntryComponent
                  key={"request-item-" + stakingItem.id + stakingItem.stakeAddress + i}
                  onRevoke={onItemRevoke}
                  stakingItem={stakingItem}
                />
              );
            })
          : !isLoading && (
              <div className="w-100 d-flex align-items-center flex-columns mt-5">
                <h4 className="text-gray text-center">You have no staking requests yet.</h4>

                <div className="mt-5" style={{ width: "220px" }} onClick={() => goToNewStaking()} tabIndex={0}>
                  <NavMenuButton content="Stake now" link="" isActive={false} icon={newSwapIcon}></NavMenuButton>
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

export default LiquidityStakingHistoryStep;
