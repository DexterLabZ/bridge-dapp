import React, { FC, useState } from "react";
import { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import TokenSelectModal from "../tokenSelectModal/tokenSelectModal";
import defaultTokenIcon from "./../../assets/tokens/zts.svg";
import "./tokenDropdown.scss";

const TokenDropdown: FC<{
  preselectedSearch: string;
  availableTokens: any[];
  availableNetworks: any[];
  token: any;
  label: string;
  placeholder: string;
  isDisabled: boolean;
  onTokenSelect: (token: any) => any;
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
}> = React.forwardRef(
  (
    {
      preselectedSearch = "",
      availableTokens = [],
      availableNetworks = [],
      token,
      label,
      placeholder,
      isDisabled = false,
      error,
      onTokenSelect,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => {
      if (!isDisabled) {
        setIsOpen(true);
      } else {
        console.error("Selecting token is temporary disabled");
      }
    };

    const closeModal = () => {
      setIsOpen(false);
    };

    const onTokenSelectFromModal = (token: any) => {
      onTokenSelect(token);
    };

    return (
      <>
        <div
          onClick={openModal}
          className={`custom-dropdown ${error ? "custom-label-error" : ""} ${isDisabled ? "soft-disabled" : ""}`}
          tabIndex={0}
        >
          {token.symbol ? (
            <>
              <div className="d-flex align-items-center">
                <img alt="token-icon" className="token-icon" src={token?.icon || defaultTokenIcon}></img>
                <div className="d-flex align-items-center pr-2 pl-2 tooltip">
                  <div className="mr-2">{token?.symbol}</div>
                  {" / "}
                  <div className="ml-2">
                    <div className="text-sm text-center">
                      {token?.network?.name} Network
                    </div>
                  </div>
                  <span className="tooltip-text">Token: {token?.address}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-100">{placeholder}</div>
          )}
          <div className="dropdown-label">{label || ""}</div>
          <span className="dropdown-arrow"></span>
        </div>
        <TokenSelectModal
          preselectedSearch={preselectedSearch}
          availableTokens={availableTokens}
          availableNetworks={availableNetworks}
          onTokenSelect={(token) => onTokenSelectFromModal(token)}
          isOpen={isOpen}
          onDismiss={closeModal}
        ></TokenSelectModal>
      </>
    );
  }
);

TokenDropdown.displayName = "TokenDropdown";

export default TokenDropdown;
