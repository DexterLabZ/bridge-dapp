import { ethers } from "ethers-ts";
import JSONbig from "json-bigint";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Primitives, Zenon } from "znn-ts-sdk";
import infoIcon from "../../../assets/info-icon.svg";
import warningIcon from "../../../assets/warning-icon.svg";
import SimpleDropdown from "../../../components/simpleDropdown/simpleDropdown";
import TokenDropdown from "../../../components/tokenDropdown/tokenDropdown";
import { LiquidityStakingItem, liquidityStakingStatus } from "../../../models/LiquidityStakingItem";
import { SimpleToken } from "../../../models/SimpleToken";
import useZenon from "../../../services/hooks/zenon-provider/useZenon";
import { storeGlobalConstants } from "../../../services/redux/globalConstantsSlice";
import { storeActiveStakingEntry, storeSuccessInfo } from "../../../services/redux/liquidityStakingEntriesSlice";
import { findInObject, hasLowPlasma, multiplyBigNumberStrings } from "../../../utils/utils";
import { simpleTokenType } from "../swapStep/swapStep";
import znnTokenIcon from "./../../../assets/tokens/znn.svg";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const LiquidityStakingStep = ({ onStepSubmit = () => { } }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ mode: "onChange" });
  const [globalConstants, setGlobalConstants] = useState(useSelector((state: any) => state.globalConstants));
  const availableLpTokens = globalConstants.liquidityTokenTuples || [];
  const availableStakingDurations = globalConstants.stakingDurations;
  const [selectedToken, setSelectedToken] = useState<simpleTokenType>({
    icon: "",
    symbol: "",
    name: "",
    address: "",
    balance: "0",
    balanceWithDecimals: "0",
    minAmountWithDecimals: "1",
    minAmount: "",
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
  const [stakingDuration, setStakingDuration] = useState<any>();
  const [tokenAmount, setTokenAmount] = useState("");
  const serializedWalletInfo = useSelector((state: any) => state.wallet);
  const [plasmaBalance, setPlasmaBalance] = useState(0);
  const zenon = Zenon.getSingleton();
  const dispatch = useDispatch();
  const { zenonClient } = useZenon();
  const walletInfo = useSelector((state: any) => state.wallet);

  useEffect(() => {
    (async () => {
      const newConstants = await updateGlobalConstants();
      setSelectedToken(newConstants.liquidityTokenTuples[0]);
      setValue("stakingTokenField", newConstants.liquidityTokenTuples[0], { shouldValidate: true });
    })();
  }, []);

  useEffect(() => {
    const zenonInfo = JSON.parse(serializedWalletInfo?.["zenonInfo"] || "{}");
    console.log("zenonInfo", zenonInfo);
    if (zenonInfo && zenonInfo?.plasma && zenonInfo?.plasma?.currentPlasma) {
      setPlasmaBalance(zenonInfo?.plasma?.currentPlasma);
    }

    if (zenonInfo) {
      const tokenWithUpdatedBalance: any = JSON.parse(
        JSON.stringify(
          findInObject(
            zenonInfo?.balanceInfoMap,
            (tok: any) => tok?.token?.tokenStandard == selectedToken.address || tok?.address == selectedToken.address
          ) || {}
        )
      );

      const newBalanceBN = ethers.BigNumber.from(tokenWithUpdatedBalance?.balance || "0");

      console.log("newBalanceBN", newBalanceBN);

      setSelectedToken((tok: simpleTokenType) => {
        return {
          ...tok,
          balance: tokenWithUpdatedBalance?.balanceWithDecimals || "0",
          balanceWithDecimals: tokenWithUpdatedBalance?.balanceWithDecimals || "0",
        };
      });
    }
  }, [serializedWalletInfo]);

  const onFormSubmit = async (formFields: any) => {
    try {
      console.log("formFields", formFields);
      console.log("parseFloat(formFields.tokenAmountField)", parseFloat(formFields.tokenAmountField));
      console.log(
        "liquidityStake params",
        formFields.stakingDurationField.value,
        Primitives.TokenStandard.parse(formFields.stakingTokenField.address).toString(),
        ethers.utils.parseUnits(
          formFields.tokenAmountField + "",
          ethers.BigNumber.from(formFields.stakingTokenField.decimals)
        )
      );

      const stakingRequest = await sendLiquidityStakeRequest(
        formFields.stakingDurationField.value,
        SimpleToken.fromJson(selectedToken),
        formFields.tokenAmountField
      );
      addCurrentLiquidityStakeRequestToList(stakingRequest);
      onStepSubmit();
    } catch (err) {
      console.error(err);
    }
  };

  const onTokenChange = (tok: simpleTokenType) => {
    setValue("stakingTokenField", tok, { shouldValidate: true });
    setSelectedToken(tok);
    console.log("Token changed, tok");
  };

  const handleSetStakingDuration = (index: number, duration: any) => {
    setValue("stakingDurationField", duration, { shouldValidate: true });
    setStakingDuration(duration);
    console.log("Duration", duration);
  };

  const updateGlobalConstants = async () => {
    // We update tokenTuples here because in the previous step we might already be connected to syrius (in the swap flow)
    // eslint-disable-next-line prefer-const
    let updatedConstants: any = {};
    Object.assign(updatedConstants, { ...globalConstants });

    const getLiquidityInfo = await zenon.embedded.liquidity.getLiquidityInfo();

    console.log("getLiquidityInfo", getLiquidityInfo);

    const znnAddressObject = Primitives.Address.parse(JSONbig.parse(serializedWalletInfo["zenonInfo"])?.address);
    const getAccountInfoByAddress = await zenon.ledger.getAccountInfoByAddress(znnAddressObject);

    console.log("getAccountInfoByAddress", getAccountInfoByAddress);
    console.log("JSONbig.stringify(getAccountInfoByAddress)", JSONbig.stringify(getAccountInfoByAddress));

    const plasma = await zenon.embedded.plasma.get(znnAddressObject);

    getAccountInfoByAddress.plasma = plasma;

    updatedConstants.liquidityTokenTuples = [];
    const updatedTuples = await Promise.all(
      getLiquidityInfo.tokenTuples.map(async (tup) => {
        console.log("tup", tup);
        const tokenInfo = await getZenonTokenInfo(tup.tokenStandard);

        return {
          ...JSONbig.parse(JSONbig.stringify(tup)),
          balance: getAccountInfoByAddress.balanceInfoMap?.[tup.tokenStandard]?.balance?.toString() || "0",
          balanceWithDecimals:
            getAccountInfoByAddress.balanceInfoMap?.[tup.tokenStandard]?.balanceWithDecimals?.toString() || "0",
          symbol: tokenInfo?.symbol,
          decimals: tokenInfo?.decimals,
          name: tokenInfo?.name,
          address: tup.tokenStandard,
          isAvailable: true,
          icon: znnTokenIcon,
          network: globalConstants.internalAvailableNetworks.find(
            (net: any) => net.name == "ZNN" || net.name == "Zenon"
          ),
          minAmount: ethers.BigNumber.from(tup?.minAmount || "0").toString(),
          minAmountWithDecimals: ethers.utils.formatUnits(
            ethers.BigNumber.from(tup?.minAmount || "0"),
            ethers.BigNumber.from(tokenInfo?.decimals)
          ),
        };
      })
    );

    console.log("updatedTuples", updatedTuples);
    
    updatedConstants.liquidityTokenTuples.push(...updatedTuples);

    dispatch(storeGlobalConstants(updatedConstants));
    
    console.log("updatedConstants - updatedTuples", updatedConstants);
    
    setGlobalConstants(updatedConstants);
    return updatedConstants;
  };

  // TODO extract this to utils
  const getZenonTokenInfo = async (tokenStandard: string) => {
    console.log("tokenStandard", tokenStandard);
    
    const tokStandard = Primitives.TokenStandard.parse(tokenStandard);
    
    console.log("tokStandard", tokStandard);
    console.log("tokStandard.toString()", tokStandard.toString());
    
    return await zenon.embedded.token.getByZts(tokStandard);
  };

  const sendLiquidityStakeRequest = async (
    duration: number,
    token: SimpleToken,
    amount: string
  ): Promise<LiquidityStakingItem> => {
    return new Promise(async (resolve, reject) => {
      try {
        const bigNumAmount = ethers.utils.parseUnits(amount.toString() || "0", ethers.BigNumber.from(token.decimals));
        const liquidityStakeAccountBlock = zenon.embedded.liquidity.liquidityStake(
          duration,
          Primitives.TokenStandard.parse(token.address || ""),
          bigNumAmount
        );
        
        console.log("liquidityStakeAccountBlock", liquidityStakeAccountBlock);
        console.log("liquidityStakeAccountBlock.toJson()", liquidityStakeAccountBlock.toJson());

        const transaction = {
          fromAddress: JSONbig.parse(walletInfo.zenonInfo || "{}")?.address,
          accountBlock: liquidityStakeAccountBlock.toJson(),
        };
        const accountBlock = await zenonClient.sendTransaction(transaction);
        
        console.log("final accountBlock", accountBlock);
        
        const hash = accountBlock?.hash.toString();

        toast("Successfully staked", {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          type: "success",
          theme: "dark",
        });

        console.log("stakingDuration", stakingDuration);
        console.log("token.decimals", token.decimals);

        const stakingRequest = LiquidityStakingItem.fromJson({
          amount: bigNumAmount.toString(),
          weightedAmount: ethers.utils
            .parseUnits(
              multiplyBigNumberStrings([amount, stakingDuration.multiplierValue.toString()], token.decimals),
              token.decimals
            )
            .toString(),
          tokenStandard: token.address,
          id: hash,
          stakeAddress: JSONbig.parse(serializedWalletInfo["zenonInfo"])?.address,
          isActiveRequest: true,
          status: liquidityStakingStatus.Pending,
          token: SimpleToken.fromJson(selectedToken),
          duration: duration,
          timestamp: Date.now() / 1000,
        });

        console.log("stakeSuccess, LiquidityStakingItem.fromJson(stakingRequest)", stakingRequest);

        dispatch(storeSuccessInfo(JSONbig.stringify(stakingRequest.toJson())));

        resolve(stakingRequest);
      } catch (err: any) {
        console.error(err);
        let readableError = JSONbig.stringify(err);

        if (err?.message) {
          readableError = err?.message;
        } else readableError = "Error staking - check console";

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
        return readableError;
      }
    });
  };

  const addCurrentLiquidityStakeRequestToList = (liquidityStakeRequest: LiquidityStakingItem) => {
    dispatch(storeActiveStakingEntry(JSONbig.stringify(liquidityStakeRequest.toJson())));

    const currentRequests = JSONbig.parse(localStorage.getItem("stakeEntries") || "[]").map((req: any) =>
      LiquidityStakingItem.fromJson(req)
    );
    console.log("liquidityStakeRequest", liquidityStakeRequest);
    currentRequests.push(liquidityStakeRequest);
    localStorage.setItem("stakeEntries", JSONbig.stringify(currentRequests.map((req: any) => req.toJson())));
  };

  return (
    <div className="mt-4 w-100">
      <form onSubmit={handleSubmit((fields: unknown) => onFormSubmit(fields))}>
        <div className="d-flex justify-content-between responsive-rows">
          <div className="flex-1 min-width-100">
            <TokenDropdown
              onTokenSelect={(token) => onTokenChange(token)}
              isDisabled={false}
              preselectedSearch={""}
              availableTokens={availableLpTokens}
              availableNetworks={[]}
              token={selectedToken}
              label={"Select LP Token"}
              placeholder={"Placeholder"}
              error={errors.stakingTokenField}
              {...register("stakingTokenField", { required: true })}
            />
            <div className={`input-error ${errors.stakingTokenField?.type === "required" ? "" : "invisible"}`}>
              Token is required
            </div>
          </div>

          <div className="flex-1 min-width-100">
            <SimpleDropdown
              {...register("stakingDurationField", { required: true })}
              name="stakingDurationField"
              label="Staking duration"
              options={availableStakingDurations}
              onChange={handleSetStakingDuration}
              value={stakingDuration}
              placeholder={"Staking duration"}
              displayKeys={["label", "multiplierLabel"]}
              className={`${errors.stakingDurationField ? "custom-label-error" : ""}`}
            />

            <div className={`input-error ${errors.stakingDurationField?.type === "required" ? "" : "invisible"}`}>
              Staking period is required
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end align-items-center height-30px">
          <div className="mt-1 text-right">
            {"Balance: "}
            {selectedToken?.balanceWithDecimals + " " + selectedToken?.symbol}
          </div>

          <div className="mt-1 ml-1">
            {!selectedToken?.balanceWithDecimals ||
              selectedToken?.balanceWithDecimals == "0" ||
              selectedToken?.balanceWithDecimals == "0.0" ||
              selectedToken?.balance == "0" ? (
              <>
                <div className="tooltip d-flex align-items-center">
                  <img alt="fees-info" className="switch-arrow mr-1" src={warningIcon} />

                  <span className="tooltip-text">
                    {`If you've already added liquidity please open the Syrius extension in order to receive the ${selectedToken?.symbol} tokens`}
                  </span>
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>

        <div className="custom-control mt-2">
          <div className={`input-with-button w-100`}>
            <input
              {...register("tokenAmountField", {
                required: true,
                min: {
                  value: selectedToken?.minAmountWithDecimals || "0",
                  message: "Minimum of " + (selectedToken?.minAmountWithDecimals + ""),
                },
                max: {
                  value: selectedToken?.balanceWithDecimals || "",
                  message: "Maximum of " + selectedToken?.balanceWithDecimals,
                },
              })}
              className={`w-100 custom-label pr-3 ${errors.tokenAmountField ? "custom-label-error" : ""}`}
              placeholder={"0.0"}
              value={tokenAmount}
              onChange={(e) => {
                setTokenAmount(e.target.value);
              }}
              type="number"></input>
            <div className="input-label">{selectedToken?.symbol + " amount"}</div>
            <div
              className={(selectedToken?.symbol === "ZNN" ? "primary" : "accent") + " input-chip-button"}
              onClick={() => {
                setTokenAmount(selectedToken?.balanceWithDecimals + "");
              }}>
              <span>{"MAX ~ " + parseFloat(selectedToken?.balanceWithDecimals + "").toFixed(0)}</span>
            </div>
          </div>

          <div className={`input-error ${errors.tokenAmountField ? "" : "invisible"}`}>
            {errors.tokenAmountField?.message + "" || "Amount is required"}
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-start mt-2">
          <div className="tooltip d-flex align-items-center">
            <img alt="fees-info" className="switch-arrow mr-1" src={infoIcon} />
            <span className="text-nowrap mr-1">{"APY: "}</span>
            {stakingDuration?.months
              ? parseFloat(stakingDuration.months * stakingDuration.multiplierValue + "").toFixed(2) + " %"
              : ""}
            <span className="tooltip-text">Annual Percentage Yield</span>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-start mt-1">
          {hasLowPlasma(plasmaBalance) ? (
            <div className="d-flex align-items-center">
              <img alt="fees-info" className="switch-arrow mr-1" src={warningIcon} />

              <div>
                It seems that you have{" "}
                <span className="text-warning text-bold tooltip">
                  low plasma
                  <span className="tooltip-text">{`Current plasma: ${plasmaBalance || 0}`}</span>
                </span>
                . We recommend fusing at least 50 QSR in the Syrius extension before making the transaction in order to
                speed up the process.
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>

        <div className={`button primary text-white mt-5`}>
          Stake LP Token
          <input className="ghost-over cursor-pointer" type="submit" name="submitButton"></input>
        </div>
      </form>
    </div>
  );
};

export default LiquidityStakingStep;
