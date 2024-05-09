import { ethers } from "ethers-ts";
import { checkMetamaskAvailability } from "../../../utils/utils";
import { ExternalWalletInfo, TransactionReceiptResponse, externalNetworkProviderTypes } from "./externalNetworkContext";

const getConnectionInfo = async (): Promise<Partial<ExternalWalletInfo>> => {
  checkMetamaskAvailability();

  const connectionInfo: Partial<ExternalWalletInfo> = {
    address: await getCurrentAccount(getProvider()),
    chainId: Number((await getProvider()?.getNetwork())?.chainId || ""),
  };

  return connectionInfo;
};

const getProvider = () => {
  checkMetamaskAvailability();
  return new ethers.providers.Web3Provider(window?.ethereum);
};

const getConnectedAccounts = async (provider: ethers.providers.Web3Provider): Promise<string[]> => {
  checkMetamaskAvailability();
  const accounts = await provider.send("eth_requestAccounts", []);
  console.log("accounts", accounts);
  return accounts;
};

const getCurrentAccount = async (provider: ethers.providers.Web3Provider): Promise<string> => {
  return (await getConnectedAccounts(provider))[0];
};

const getCurrentChainId = async (provider: ethers.providers.Web3Provider): Promise<number> => {
  const currentChainId = (await (provider as ethers.providers.JsonRpcProvider)?.getNetwork())?.chainId || 0;
  return currentChainId;
};

const getBalance = async (
  provider: ethers.providers.Web3Provider,
  account: string,
  tokenAddress?: string,
  tokenAbi?: string,
  isNativeCoin = false
): Promise<ethers.BigNumber> => {
  if (!isNativeCoin && tokenAddress && tokenAbi) {
    // Return the balance of the custom token
    const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    return await contract.balanceOf(account);
  } else {
    // Return the balance of the native token (ETH)
    return await provider.getBalance(account);
  }
};

const estimateGas = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  params: any = [],
  currentUserAddress?: string,
  transactionValue: ethers.BigNumber = ethers.BigNumber.from("0"),
  transactionGasLimit: ethers.BigNumber = ethers.BigNumber.from("0")
) => {
  console.log("estimateGas()");
  console.log("contractAddress", contractAddress);
  console.log("functionName", functionName);
  console.log("provider", provider);
  console.log("params", params);

  const contract = new ethers.Contract(contractAddress, abi, provider);
  const signer = new ethers.providers.Web3Provider(window?.ethereum).getSigner();
  const signedContract = contract.connect(signer);
  console.log("contract", contract);
  console.log("signedContract", signedContract);

  type transactionExtraParameters = {
    value?: ethers.BigNumber;
    from?: string;
    gasLimit?: ethers.BigNumber;
  };
  const extraParameters: transactionExtraParameters = {};

  if (!transactionValue.isZero()) {
    extraParameters.value = transactionValue;
  } else {
    extraParameters.value = ethers.BigNumber.from("0");
  }

  if (!transactionGasLimit.isZero()) {
    extraParameters.gasLimit = transactionGasLimit;
  }
  const res = await signedContract.estimateGas[functionName](...params, extraParameters);

  return res;
};

const callContract = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  params: any = [],
  currentUserAddress?: string,
  transactionValue: ethers.BigNumber = ethers.BigNumber.from("0"),
  transactionGasLimit: ethers.BigNumber = ethers.BigNumber.from("0")
) => {
  console.log("callContract()");
  console.log("contractAddress", contractAddress);
  console.log("functionName", functionName);
  console.log("provider", provider);
  console.log("params", params);

  const contract = new ethers.Contract(contractAddress, abi, provider);
  const signer = new ethers.providers.Web3Provider(window?.ethereum).getSigner();
  const signedContract = contract.connect(signer);
  console.log("contract", contract);
  console.log("signedContract", signedContract);

  type transactionExtraParameters = {
    value?: ethers.BigNumber;
    from?: string;
    gasLimit?: ethers.BigNumber;
  };
  const extraParameters: transactionExtraParameters = {};

  if (!transactionValue.isZero()) {
    extraParameters.value = transactionValue;
  } else {
    extraParameters.value = ethers.BigNumber.from("0");
  }
  console.log("trParams", params);
  console.log("extraParameters", extraParameters);

  if (!transactionGasLimit.isZero()) {
    extraParameters.gasLimit = transactionGasLimit;
  }
  const res = await signedContract[functionName](...params, extraParameters);
  console.log("callContract res", res);
  await res.wait();

  const response: TransactionReceiptResponse = {
    hash: res?.hash,
    logIndex: res?.transactionIndex,
  };
  console.log("TransactionReceiptResponse", response);

  return response;
};

const sendTransaction = async (accountBlock: any) => {
  // return new Promise<TransactionReceiptResponse>(async (resolve, reject) => {
  // Unused at this moment
  // });
};

const requestNetworkSwitch = async (newChainId: number) => {
  console.log("requestNetworkSwitch()");

  const rawResult = await window?.ethereum?.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: ethers.utils.hexValue(newChainId) }], // chainId must be in hexadecimal numbers
  });

  return rawResult;
};

const unregisterEvents = (changeEventHandlers: MetamaskChangeEventsHandler) => {
  console.log("Removing web3 change listeners", changeEventHandlers);
  window?.ethereum?.removeListener("accountsChanged", changeEventHandlers.accountsChanged);
  window?.ethereum?.removeListener("chainChanged", changeEventHandlers.chainChanged);
};

export type MetamaskAccountsChangedHandler = (accounts: any) => void;
export type MetamaskChainChangedHandler = (chainId: any) => void;

export type MetamaskChangeEventsHandler = {
  accountsChanged: MetamaskAccountsChangedHandler;
  chainChanged: MetamaskChainChangedHandler;
};

const registerEvents = (
  provider: ethers.providers.Web3Provider,
  onDisconnect: () => Promise<boolean>,
  onAddressChange: (
    newAddress: string,
    provider: ethers.providers.Web3Provider,
    providerType: externalNetworkProviderTypes
  ) => unknown,
  onChainIdChange: (
    newChainId: string,
    provider: ethers.providers.Web3Provider,
    providerType: externalNetworkProviderTypes
  ) => unknown
) => {
  const accountChangedHandler: MetamaskAccountsChangedHandler = (accounts: any) => {
    console.log("metamaskWrapper - accountChangedHandler", accounts);

    // const oldErcInfo = JSONbig.parse(serializedWalletInfo["ercInfo"] || "{}");
    // dispatch(storeErcInfo(JSONbig.stringify({ ...oldErcInfo, address: accounts[0]?.toLowerCase() })));
    if (!accounts?.length) {
      onDisconnect();
    } else {
      onAddressChange(accounts, provider, externalNetworkProviderTypes.metamask);
    }
  };
  window?.ethereum?.on("accountsChanged", accountChangedHandler);

  const chainChangedHandler: MetamaskChainChangedHandler = (chainId: any) => {
    console.log("metamaskWrapper - chainChangedHandler", chainId);
    console.log("metamaskWrapper - chainId", ethers.BigNumber.from(chainId).toNumber());
    const newChainId = ethers.BigNumber.from(chainId).toNumber();
    console.log("newChainId", newChainId);

    onChainIdChange(newChainId.toString(), provider, externalNetworkProviderTypes.metamask);
    // window.location.reload();
  };
  window?.ethereum?.on("chainChanged", chainChangedHandler);

  const changeEventsHandlers: MetamaskChangeEventsHandler = {
    accountsChanged: accountChangedHandler,
    chainChanged: chainChangedHandler,
  };

  return changeEventsHandlers;
};

const metamaskExtensionWrapper = {
  getConnectionInfo,
  getConnectedAccounts,
  getCurrentAccount,
  getCurrentChainId,
  getBalance,
  getProvider,
  callContract,
  estimateGas,
  sendTransaction,
  requestNetworkSwitch,
  registerEvents,
  unregisterEvents,
};

export default metamaskExtensionWrapper;
