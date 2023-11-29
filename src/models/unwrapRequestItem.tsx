import { simpleTokenType } from "../pages/wizardSteps/swapStep/swapStep";

export enum unwrapRequestStatus {
  Signing = "Signing",
  WaitingConfirmation = "WaitingConfirmation",
  Redeemable = "Redeem",
  Redeemed = "Redeemed",
  Broken = "Broken",
  Revoked = "Revoked",
}

export class UnwrapRequestItem {
  transactionHash: string;
  amount: string;
  feeAmount: string;
  chainId?: number;
  networkClass?: number;
  redeemableIn?: number;
  redeemDelayInSeconds?: number;
  signature?: string;
  fromAddress?: string;
  toAddress?: string;
  tokenAddress?: string;
  tokenStandard?: string;
  status?: unwrapRequestStatus;
  fromToken?: simpleTokenType;
  toToken?: simpleTokenType;
  timestamp?: number;
  isActiveRequest?: boolean;
  id?: string;
  logIndex?: number;
  originalAmount?: number;
  isFromAffiliation?: boolean;

  constructor(
    transactionHash: string,
    amount: string,
    feeAmount: string,
    chainId?: number,
    networkClass?: number,
    redeemableIn?: number,
    redeemDelayInSeconds?: number,
    signature?: string,
    fromAddress?: string,
    toAddress?: string,
    tokenAddress?: string,
    tokenStandard?: string,
    status?: unwrapRequestStatus,
    fromToken?: simpleTokenType,
    toToken?: simpleTokenType,
    timestamp?: number,
    isActiveRequest?: boolean,
    id?: string,
    logIndex?: number,
    originalAmount?: number,
    isFromAffiliation?: boolean
  ) {
    this.transactionHash = transactionHash;
    this.amount = amount;
    this.feeAmount = feeAmount;
    this.chainId = chainId;
    this.networkClass = networkClass;
    this.redeemableIn = redeemableIn;
    this.redeemDelayInSeconds = redeemDelayInSeconds;
    this.signature = signature;
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.tokenAddress = tokenAddress;
    this.tokenStandard = tokenStandard;
    this.status = status;
    this.fromToken = fromToken;
    this.toToken = toToken;
    this.timestamp = timestamp;
    this.isActiveRequest = isActiveRequest;
    this.id = id;
    this.logIndex = logIndex;
    this.originalAmount = originalAmount;
    this.isFromAffiliation = isFromAffiliation;
  }

  static fromJson(json: { [key: string]: any }): UnwrapRequestItem {
    return new UnwrapRequestItem(
      json["transactionHash"],
      json["amount"],
      json["feeAmount"],
      json["chainId"],
      json["networkClass"],
      json["redeemableIn"],
      json["redeemDelayInSeconds"],
      json["signature"],
      json["fromAddress"],
      json["toAddress"],
      json["tokenAddress"],
      json["tokenStandard"],
      json["status"],
      json["fromToken"],
      json["toToken"],
      json["timestamp"],
      json["isActiveRequest"],
      json["id"],
      json["logIndex"],
      json["originalAmount"],
      json["isFromAffiliation"]
    );
  }

  static toJson(requestItem: UnwrapRequestItem) {
    return {
      transactionHash: requestItem.transactionHash,
      amount: requestItem.amount,
      feeAmount: requestItem.feeAmount,
      chainId: requestItem?.chainId,
      networkClass: requestItem?.networkClass,
      redeemableIn: requestItem?.redeemableIn,
      redeemDelayInSeconds: requestItem?.redeemDelayInSeconds,
      signature: requestItem?.signature,
      fromAddress: requestItem?.fromAddress,
      toAddress: requestItem?.toAddress,
      tokenAddress: requestItem?.tokenAddress,
      tokenStandard: requestItem?.tokenStandard,
      status: requestItem?.status,
      fromToken: requestItem?.fromToken,
      toToken: requestItem?.toToken,
      timestamp: requestItem?.timestamp,
      isActiveRequest: requestItem?.isActiveRequest,
      id: requestItem?.id,
      logIndex: requestItem?.logIndex,
      originalAmount: requestItem?.originalAmount,
      isFromAffiliation: requestItem?.isFromAffiliation,
    };
  }
}
