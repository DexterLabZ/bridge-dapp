/* eslint-disable @typescript-eslint/no-empty-function */
import React, { FC, ReactNode, useEffect, useState } from "react";
import "./simpleDropdown.scss";

const SimpleDropdown: FC<{
  name: string;
  className: string;
  options: any[];
  onChange: (index: number, value: any) => void;
  value: any;
  label: string;
  placeholder: string;
  displayKeys: string[];
}> = React.forwardRef(({ name, className, options, onChange, value, label, placeholder, displayKeys = [] }, ref) => {
  const [isOpened, setIsOpened] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const clickControl = () => {
    setIsOpened(!isOpened);
  };

  const clickOption = (i: number, value: any) => {
    setSelectedIndex(i);
    onChange(i, value);
    setIsOpened(!isOpened);
  };

  useEffect(() => {
    options.filter((currentValue, i) => {
      if (currentValue === value) {
        setSelectedIndex(i);
        setIsOpened(false);
        onChange(i, value);
      }
    });
  }, [value]);

  return (
    <div className={`Dropdown-root ${isOpened ? "is-open" : ""}`}>
      <div className={`${className} w-100 Dropdown-control`} tabIndex={0} onClick={clickControl}>
        <div className="d-flex justify-content-between">
          {selectedIndex || selectedIndex === 0
            ? displayKeys.length >= 0
              ? displayKeys.map((displayKey) => {
                return (
                  <div key={"option-index-top-" + displayKey}>
                    {
                      displayKey
                        .split(".")
                        .reduce(
                          (p: { [x: string]: any }, c: string | number) => (p && p[c]) || "",
                          options[selectedIndex]
                        ) as unknown as ReactNode
                    }
                  </div>
                );
              })
              : options[selectedIndex]
            : placeholder}
        </div>
        <span className="Dropdown-arrow"></span>
      </div>
      <div className="Dropdown-label">{label || ""}</div>

      <div className="mt-0 Dropdown-menu">
        {options.map(function (currentValue, i) {
          if (options.length === 1 || currentValue !== value) {
            return (
              <div
                className="Dropdown-option d-flex justify-content-between"
                key={i}
                onClick={() => clickOption(i, currentValue)}>
                {displayKeys.length >= 0
                  ? displayKeys.map((displayKey) => {
                    return (
                      <div key={"option-index-top-" + displayKey}>
                        {
                          displayKey
                            .split(".")
                            .reduce(
                              (p: { [x: string]: any }, c: string | number) => (p && p[c]) || "",
                              currentValue
                            ) as unknown as ReactNode
                        }
                      </div>
                    );
                  })
                  : currentValue}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
});

SimpleDropdown.displayName = "SimpleDropdown";

export default SimpleDropdown;
