import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CloseIconButton from "../animated-icons/close-button-icon/close-button-icon";
import defaultNetworkIcon from "./../../assets/networks/zenon.svg";
import defaultTokenIcon from "./../../assets/tokens/zts.svg";
import "./tokenSelectModal.scss";

const TokenSelectModal: FC<{
  preselectedSearch: string;
  availableTokens: any[];
  availableNetworks: any[];
  isOpen: boolean;
  onTokenSelect: (token: any) => any;
  onDismiss: () => any;
}> = ({
  preselectedSearch = "",
  availableTokens = [],
  availableNetworks = [],
  isOpen = false,
  onTokenSelect,
  onDismiss,
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({ mode: "onChange" });

  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [searchString, setSearchString] = useState("");
  const [searchError, setSearchError] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<any>({});
  const [filteredTokens, setFilteredTokens] = useState(availableTokens);
  const [searchedTokens, setSearchedTokens] = useState(availableTokens);

  const selectToken = (token: any) => {
    console.log("selected Token", token);
    onTokenSelect(token);
    closeModal();
  };

  useEffect(() => {
    setIsModalOpen(isOpen);
    if (isOpen) setIsFirstRender(false);
  }, [isOpen]);

  const triggerSearch = () => {
    setSearchString(searchString);
  };

  const selectNetwork = (network: any) => {
    let filtered = availableTokens;
    if (selectedNetwork?.chainId === network.chainId) {
      setSelectedNetwork("");
    } else {
      setSelectedNetwork(network);
      filtered = availableTokens.filter((token) => {
        if (token.network.chainId == network?.chainId) {
          return token;
        }
      });
    }
    setFilteredTokens(filtered);
  };

  useEffect(() => {
    setSearchedTokens(
      filteredTokens.filter((token) => {
        if (JSON.stringify(Object.values(token)).toLowerCase().includes(searchString.toLowerCase())) {
          return token;
        }
      })
    );
  }, [searchString, filteredTokens]);

  useEffect(() => {
    setSearchString("");
    setSelectedNetwork("");

    setFilteredTokens(availableTokens);
    setSelectedNetwork({});
  }, [availableTokens]);

  useEffect(() => {
    setSearchString(preselectedSearch);
  }, [preselectedSearch]);

  const closeModal = () => {
    setIsModalOpen(false);
    onDismiss();
  };

  return (
    <div
      className={`token-select-modal-container ${isFirstRender ? "hidden-modal" : ""} ${
        isModalOpen ? "open-modal" : "closed-modal"
      }`}>
      <div onClick={closeModal} className={`token-select-modal-backdrop `}></div>
      <div className={`modal-content-container`}>
        <div className="modal-header d-flex justify-content-center">
          <h2>Select a token / network</h2>
          <div
            onClick={() => {
              closeModal();
            }}
            className="close-modal-button p-2 animate-on-hover">
            <CloseIconButton />
          </div>
        </div>
        <div className={`modal-divider primary`}></div>
        <div className="modal-content p-4">
          <form>
            <div className="custom-control flex-1 min-width-100">
              <input
                {...register("search", { required: true })}
                className={`w-100 custom-label ${searchError ? "custom-label-error" : ""}`}
                placeholder="Search by symbol, network, token standard or token address"
                value={searchString}
                onChange={(e) => {
                  setSearchString(e.target.value);
                }}
                type="text"></input>
              <div className="input-label">{"Search token"}</div>

              <div
                className={`${searchString.length ? "" : "d-none"} alert clear-input-button`}
                onClick={() => {
                  setSearchString("");
                }}>
                <span>X</span>
              </div>

              <div className={`input-error ${searchError ? "" : "invisible"}`}>{searchError}</div>
            </div>
            <input
              className="invisible"
              type="submit"
              name="submitButton"
              onClick={(e) => {
                e.preventDefault();
                triggerSearch();
              }}></input>
          </form>

          {availableNetworks.length > 1 && (
            <>
              <h4>Filter by network</h4>
              <div className="d-flex flex-wrap" style={{ gap: "1rem" }}>
                {availableNetworks.map((network, index) => {
                  return (
                    <div
                      onClick={() => selectNetwork(network)}
                      key={network.name + "-" + network.chainId + "-" + index}
                      className={`selectable-chip mr-2 ${
                        selectedNetwork?.chainId === network.chainId ? "selected" : ""
                      }`}>
                      <div className="mr-1">
                        <img src={network.icon || defaultNetworkIcon} width="25px" height="25px" className=""></img>
                      </div>
                      <div>{network.name} Network</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <h4>All tokens</h4>
          <div className="">
            {searchedTokens.map((token, index) => {
              return token?.isAvailable || token?.availableSoon ? (
                <div
                  key={token.symbol + "-" + token?.network?.name + "-" + index}
                  className={`${!token?.isAvailable && token?.availableSoon ? "available-soon" : ""}`}>
                  <span className="available-soon-label">Available soon</span>
                  <div
                    onClick={() => selectToken(token)}
                    className={`token-chip mb-2 d-flex align-items-center primary-shadow-on-hover`}>
                    <div className="mr-2" style={{ width: "42px", height: "42px" }}>
                      <img className="" width="100%" height="100%" src={token?.icon || defaultTokenIcon}></img>
                    </div>
                    <div>
                      <div className="d-flex">
                        {token?.symbol ? (
                          <>
                            <span className="text-bold text-white">{token?.symbol}</span>
                          </>
                        ) : (
                          <></>
                        )}
                        {token?.name ? (
                          <>
                            <span className="mr-2 ml-2 ">-</span>
                            <span className="text-bold text-white">{token?.name}</span>
                          </>
                        ) : (
                          <></>
                        )}

                        {token?.address ? (
                          <>
                            <span className="mr-2 ml-2 ">-</span>
                            <span className="tooltip ">
                              {token?.address?.slice(0, 3) + "..." + token?.address?.slice(-3)}
                              <span className="tooltip-text">{token?.address}</span>
                            </span>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                      <div className="d-flex mt-1">
                        <div className="">On {token?.network?.name} Network</div>
                        <img className="ml-1" src={token?.network?.icon || defaultNetworkIcon}></img>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              );
            })}
            {searchString && searchedTokens.length == 0 && (
              <div className="text-gray">
                <h4>No tokens found</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenSelectModal;
