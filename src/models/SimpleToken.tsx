import { BigNumber } from "ethers-ts";
import { SimpleNetwork } from "./SimpleNetwork";

export class SimpleToken {
  icon: string;
  symbol: string;
  name: string;
  address: string;
  isAvailable: boolean;
  decimals: number;
  balance?: string;
  balanceWithDecimals?: string;
  minAmountWithDecimals?: string;
  minAmount?: BigNumber;
  isCommonToken?: boolean;
  network?: SimpleNetwork;

  constructor(
    icon: string,
    symbol: string,
    name: string,
    address: string,
    isAvailable: boolean,
    decimals: number,
    balance?: string,
    balanceWithDecimals?: string,
    minAmountWithDecimals?: string,
    minAmount?: BigNumber,
    isCommonToken?: boolean,
    network?: SimpleNetwork
  ) {
    (this.icon = icon),
      (this.symbol = symbol),
      (this.name = name),
      (this.address = address),
      (this.isAvailable = isAvailable),
      (this.decimals = decimals),
      (this.balance = balance),
      (this.balanceWithDecimals = balanceWithDecimals),
      (this.minAmountWithDecimals = minAmountWithDecimals),
      (this.minAmount = minAmount),
      (this.isCommonToken = isCommonToken),
      (this.network = network);
  }

  toJson(): { [key: string]: any } {
    return {
      icon: this.icon,
      symbol: this.symbol,
      name: this.name,
      address: this.address,
      isAvailable: this.isAvailable,
      decimals: this.decimals,
      balance: this.balance,
      balanceWithDecimals: this.balanceWithDecimals,
      minAmountWithDecimals: this.minAmountWithDecimals,
      minAmount: this.minAmount,
      isCommonToken: this.isCommonToken,
      network: this?.network ? this.network.toJson() : this?.network,
    };
  }

  static fromJson(json: { [key: string]: any }) {
    return new SimpleToken(
      json.icon,
      json.symbol,
      json.name,
      json.address,
      json.isAvailable,
      json.decimals,
      json.balance,
      json.balanceWithDecimals,
      json.minAmountWithDecimals,
      BigNumber.from(json.minAmount),
      json.isCommonToken,
      json.network ? SimpleNetwork.fromJson(json.network) : json.network
    );
  }
}
