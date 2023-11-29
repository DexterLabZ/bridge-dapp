export class SimpleNetwork {
  name: string;
  chainId: number;
  contractAddress?: string;
  networkClass?: number;
  isAvailable: boolean;
  icon?: any;
  color?: string;

  constructor(
    name: string,
    chainId: number,
    isAvailable: boolean,
    contractAddress?: string,
    networkClass?: number,
    icon?: any,
    color?: string
  ) {
    this.name = name;
    this.chainId = chainId;
    this.contractAddress = contractAddress;
    this.networkClass = networkClass;
    this.isAvailable = isAvailable;
    this.icon = icon;
    this.color = color;
  }

  toJson(): {[key: string]: any} {
    return {
      name: this.name,
      chainId: this.chainId,
      contractAddress: this.contractAddress,
      networkClass: this.networkClass,
      isAvailable: this.isAvailable,
      icon: this.icon,
      color: this.color,
    };
  }

  static fromJson(json: {[key: string]: any}) {
    return new SimpleNetwork(
      json.name,
      json.chainId,
      json.isAvailable,
      json.contractAddress,
      json.networkClass,
      json.icon,
      json.color
    );
  }
}
