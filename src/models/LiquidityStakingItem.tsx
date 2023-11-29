import { BigNumber, ethers } from "ethers-ts";
import { Models, Primitives } from "znn-ts-sdk";
import { Address } from "znn-ts-sdk/dist/lib/src/model/primitives/address";
import { Hash } from "znn-ts-sdk/dist/lib/src/model/primitives/hash";
import { TokenStandard } from "znn-ts-sdk/dist/lib/src/model/primitives/token_standard";
import { SimpleToken } from "./SimpleToken";

export enum liquidityStakingStatus {
  Pending = "Pending",
  Waiting = "Revoke in",
  Revokable = "Revoke",
  Revoked = "Revoked",
}

export class LiquidityStakingItem extends Models.LiquidityStakeEntry {
  isActiveRequest?: boolean;
  timestamp?: number;
  status?: liquidityStakingStatus;
  token?: SimpleToken;
  duration?: number;

  constructor(
    amount: BigNumber,
    tokenStandard: TokenStandard,
    weightedAmount: BigNumber,
    startTime: number,
    revokeTime: number,
    expirationTime: number,
    stakeAddress: Address,
    id: Hash,
    isActiveRequest?: boolean,
    timestamp?: number,
    status?: liquidityStakingStatus,
    token?: SimpleToken,
    duration?: number
  ) {
    super(amount, tokenStandard, weightedAmount, startTime, revokeTime, expirationTime, stakeAddress, id);
    this.isActiveRequest = isActiveRequest;
    this.timestamp = timestamp;
    this.status = status;
    this.token = token;
    this.duration = duration;
  }

  static fromJson(json: { [key: string]: any }): LiquidityStakingItem {
    return new LiquidityStakingItem(
      ethers.BigNumber.from(json.amount),
      Primitives.TokenStandard.parse(json.tokenStandard),
      ethers.BigNumber.from(json.weightedAmount),
      json.startTime,
      json.revokeTime,
      json.expirationTime,
      Primitives.Address.parse(json.stakeAddress),
      json.id ? Primitives.Hash.parse(json.id) : json.id,
      json.isActiveRequest,
      json.timestamp,
      json.status,
      json.token ? SimpleToken.fromJson(json.token) : json.token,
      json.duration
    );
  }

  toJson(): { [key: string]: any } {
    return {
      amount: this.amount?.toString(),
      tokenStandard: this.tokenStandard.toString(),
      weightedAmount: this.weightedAmount?.toString(),
      startTime: this.startTime,
      revokeTime: this.revokeTime,
      expirationTime: this.expirationTime,
      stakeAddress: this.stakeAddress.toString(),
      id: this?.id ? this.id.toString() : this?.token,
      isActiveRequest: this.isActiveRequest,
      timestamp: this.timestamp,
      status: this.status,
      token: this?.token ? this.token.toJson() : this?.token,
      duration: this.duration,
    };
  }
}
