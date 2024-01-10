import {ethers} from "ethers-ts";
import {Primitives} from "znn-ts-sdk";
import {AccountBlockTemplate} from "znn-ts-sdk/dist/lib/src/model/nom/account_block_template";
import {checkMetamaskAvailability} from "../../../utils/utils";

const getProvider = () => {
  checkMetamaskAvailability();
  return new ethers.providers.Web3Provider(window.ethereum);
};

const getInfo = async () => {
  return new Promise<any>(async (resolve, reject) => {
    // const messageHandler = async (event: any) => {
    //   try {
    //     const parsedData = event.data;
    //     if (parsedData.method) {
    //       switch (parsedData.method) {
    //         case "znn.grantedWalletRead": {
    //           console.log("znn.grantedWalletRead", parsedData);
    //           type walletInfoData = {
    //             address: string;
    //             chainId: number;
    //             nodeUrl: string;
    //           };
    //           resolve(parsedData.data as walletInfoData);
    //           console.log("Removing event listener");
    //           window.removeEventListener("message", messageHandler, false);
    //           break;
    //         }
    //         case "znn.deniedWalletRead": {
    //           console.log("znn.deniedWalletRead", parsedData);
    //           console.log("Removing event listener");
    //           window.removeEventListener("message", messageHandler, false);
    //           throw "Denied wallet read.";
    //         }
    //       }
    //     }
    //     return true;
    //   } catch (err: any) {
    //     console.error(err);
    //     let readableError = err;
    //     if (err?.message) {
    //       readableError = err?.message;
    //     }
    //     readableError =
    //       readableError?.split(`"Error:`)?.pop()?.split(`"`)[0] ||
    //       readableError?.split(`'Error:`)?.pop()?.split(`'`)[0] ||
    //       "";
    //     console.log("Removing event listener");
    //     window.removeEventListener("message", messageHandler, false);
    //     reject(err);
    //     return true;
    //   }
    // };
    // window.addEventListener("message", messageHandler);
    // window.postMessage(
    //   {
    //     method: "znn.requestWalletAccess",
    //     params: {},
    //   },
    //   "*"
    // );
    //
    // Something like this
    //
    // const externalNetworkDetails = await getMetamaskAddress();
    // externalNetworkAddress = externalNetworkDetails.address;
    // externalNetworkChainId = externalNetworkDetails.chainId;
    // provider = externalNetworkDetails.provider;
    // currentToken = globalConstants.externalAvailableTokens.find(
    //   (tok: any) => tok.isAvailable && externalNetworkChainId === tok.network.chainId
    // );
    // // ToDo create contract with selected external token (make wznn ABI as default but get it from internalAvTok)
    // console.log("new Contract", currentToken.address, globalConstants.wznnAbi, provider);
    // const contract = new ethers.Contract(currentToken.address, globalConstants.wznnAbi, provider);
    // const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
    // const signedContract = contract.connect(signer);
    // const rawWznnBalance = await signedContract.balanceOf(externalNetworkAddress);
    // wznnBalance = ethers.utils.formatUnits(rawWznnBalance, currentToken.decimals);
  });
};

const callContract = async (
  provider: any,
  contractAddress: string,
  abi: string,
  functionName: string,
  params: any = []
) => {
  console.log("callContract()");
  console.log("contractAddress", contractAddress);
  console.log("functionName", functionName);
  console.log("provider", provider);
  console.log("params", params);

  const contract = new ethers.Contract(contractAddress, abi, provider);
  const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  const signedContract = contract.connect(signer);
  console.log("contract", contract);
  console.log("signedContract", signedContract);
  const res = await signedContract[functionName](...params);
  console.log("callContract res", res);
  return res;
};

const sendTransaction = async (accountBlock: any) => {
  return new Promise<AccountBlockTemplate>(async (resolve, reject) => {
    window.postMessage(
      {
        method: "znn.sendAccountBlockToSend",
        params: accountBlock,
      },
      "*"
    );

    const messageHandler = (event: any) => {
      console.log("Message received on site ", event);
      try {
        const parsedData = event.data;
        console.log("parsedData", parsedData);

        if (parsedData.method) {
          switch (parsedData.method) {
            case "znn.accountBlockSent": {
              const result = parsedData.data;
              console.log("result", result);
              const accountBlock = Primitives.AccountBlockTemplate.fromJson(result?.signedTransaction || "{}");

              resolve(accountBlock);
              console.log("Removing event listener");
              window.removeEventListener("message", messageHandler, false);
              break;
            }
            case "znn.deniedSendAccountBlock": {
              console.log("parsedData.error", parsedData.error);
              reject(Error("Denied block sending."));
              console.log("Removing event listener");
              window.removeEventListener("message", messageHandler, false);
            }
          }
        }
        return true;
      } catch (err) {
        console.error(err);
        console.log("Removing event listener");
        window.removeEventListener("message", messageHandler, false);
        reject(err);
        return true;
      }
    };
    window.addEventListener("message", messageHandler);
  });
};

const unregisterEvents = (messageHandler: any) => {
  console.log("Removing event listener");
  window.removeEventListener("message", messageHandler, false);
};

const registerEvents = (
  onAddressChange: (newAddress: string) => unknown,
  onChainIdChange: (newChainId: string) => unknown
) => {
  const messageHandler = async (event: any) => {
    const parsedData = event?.data;
    if (parsedData.method) {
      switch (parsedData.method) {
        case "znn.addressChanged": {
          console.log(parsedData);

          const newAddress = parsedData.data?.newAddress;
          // console.log("addressChanged to", newAddress);
          onAddressChange(newAddress);

          console.log("Removing event listener");

          break;
        }
        case "znn.chainIdChanged": {
          console.log("parsedData", parsedData);

          const newChainId = parsedData.data?.newChainId;
          // console.log("chainIdChanged to", newChainId);
          onChainIdChange(newChainId);

          break;
        }

        default: {
          console.log("Other event triggered: ", parsedData.method);
          break;
        }
      }
    }
    return true;
  };

  window.addEventListener("message", messageHandler);

  return messageHandler;
};

const metamaskExtensionWrapper = {
  getInfo,
  getProvider,
  callContract,
  sendTransaction,
  registerEvents,
  unregisterEvents,
};

export default metamaskExtensionWrapper;
