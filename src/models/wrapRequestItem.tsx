import { simpleTokenType } from "../pages/wizardSteps/swapStep/swapStep";

export enum wrapRequestStatus {
  Signing = "Signing",
  Redeemable = "Redeem",
  WaitingDelay = "WaitingDelay",
  PartialRedeemed = "Redeemed 1/2",
  FinalRedeemed = "Redeemed 2/2",
  Broken = "Broken",
}

export class WrapRequestItem {
  id: string;
  amount: string;
  feeAmount?: string;
  chainId?: number;
  networkClass?: number;
  redeemDelayInSeconds?: number;
  signature?: string;
  fromAddress?: string;
  toAddress?: string;
  tokenAddress?: string;
  tokenStandard?: string;
  status?: wrapRequestStatus;
  fromToken?: simpleTokenType;
  toToken?: simpleTokenType;
  timestamp?: number;
  isActiveRequest?: boolean;
  transactionHash?: string;
  transactionBlockNumber?: number;

  constructor(
    id: string,
    amount: string,
    feeAmount?: string,
    chainId?: number,
    networkClass?: number,
    redeemDelayInSeconds?: number,
    signature?: string,
    fromAddress?: string,
    toAddress?: string,
    tokenAddress?: string,
    tokenStandard?: string,
    status?: wrapRequestStatus,
    fromToken?: simpleTokenType,
    toToken?: simpleTokenType,
    timestamp?: number,
    isActiveRequest?: boolean,
    transactionHash?: string,
    transactionBlockNumber?: number
  ) {
    this.id = id;
    this.amount = amount;
    this.feeAmount = feeAmount;
    this.chainId = chainId;
    this.networkClass = networkClass;
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
    this.transactionHash = transactionHash;
    this.transactionBlockNumber = transactionBlockNumber;
  }

  static fromJson(json: { [key: string]: any }): WrapRequestItem {
    return new WrapRequestItem(
      json["id"],
      json["amount"],
      json["feeAmount"],
      json["chainId"],
      json["networkClass"],
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
      json["transactionHash"],
      json["transactionBlockNumber"]
    );
  }

  static toJson(requestItem: WrapRequestItem) {
    return {
      id: requestItem.id,
      amount: requestItem.amount,
      feeAmount: requestItem?.feeAmount,
      chainId: requestItem?.chainId,
      networkClass: requestItem?.networkClass,
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
      transactionHash: requestItem?.timestamp,
      transactionBlockNumber: requestItem?.isActiveRequest,
    };
  }
}
