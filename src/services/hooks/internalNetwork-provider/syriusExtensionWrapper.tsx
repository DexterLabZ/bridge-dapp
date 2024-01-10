import {Primitives} from "znn-ts-sdk";
import {AccountBlockTemplate} from "znn-ts-sdk/dist/lib/src/model/nom/account_block_template";

const getInfo = async () => {
  return new Promise<any>(async (resolve, reject) => {
    const messageHandler = async (event: any) => {
      try {
        const parsedData = event.data;
        if (parsedData.method) {
          switch (parsedData.method) {
            case "znn.grantedWalletRead": {
              console.log("znn.grantedWalletRead", parsedData);
              type walletInfoData = {
                address: string;
                chainId: number;
                nodeUrl: string;
              };

              resolve(parsedData.data as walletInfoData);
              console.log("Removing event listener");
              window.removeEventListener("message", messageHandler, false);
              break;
            }
            case "znn.deniedWalletRead": {
              console.log("znn.deniedWalletRead", parsedData);

              console.log("Removing event listener");
              window.removeEventListener("message", messageHandler, false);
              throw "Denied wallet read.";
            }
          }
        }
        return true;
      } catch (err: any) {
        console.error(err);

        let readableError = err;
        if (err?.message) {
          readableError = err?.message;
        }
        readableError =
          readableError?.split(`"Error:`)?.pop()?.split(`"`)[0] ||
          readableError?.split(`'Error:`)?.pop()?.split(`'`)[0] ||
          "";

        console.log("Removing event listener");
        window.removeEventListener("message", messageHandler, false);

        reject(err);
        return true;
      }
    };

    window.addEventListener("message", messageHandler);

    window.postMessage(
      {
        method: "znn.requestWalletAccess",
        params: {},
      },
      "*"
    );
  });
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
  onChainIdChange: (newChainId: string) => unknown,
  onNodeChange: (newNode: string) => unknown
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

        case "znn.nodeChanged": {
          console.log("parsedData", parsedData);

          const newNode = parsedData.data?.newNode;
          // console.log("nodeChanged to", newNode);
          onNodeChange(newNode);

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

const syriusExtensionWrapper = {getInfo, sendTransaction, registerEvents, unregisterEvents};

export default syriusExtensionWrapper;
