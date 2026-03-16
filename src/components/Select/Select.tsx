import "./style.css";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type SelectSize = "large" | "medium" | "small";
type SelectMode = "multiple" | "tags";
type SelectStatus = "error" | "warning";

type SelectOption = {
  label: ReactNode;
  value: string;
  text?: string;
  disabled?: boolean;
};

type SelectValue = string | string[];

type SelectProps = {
  options: SelectOption[];
  value?: SelectValue;
  defaultValue?: SelectValue;
  placeholder?: string;
  size?: SelectSize;
  showSearch?: boolean;
  mode?: SelectMode;
  status?: SelectStatus;
  maxCount?: number;
  disabled?: boolean;
  onChange?: (value: SelectValue) => void;
};

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 14 14"
      width="1em"
    >
      <path
        d="M3.5 5.5L7 9L10.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Select({
  options,
  value,
  defaultValue,
  placeholder = "Please select",
  size = "medium",
  showSearch = false,
  mode,
  status,
  maxCount,
  disabled = false,
  onChange,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [searchValue, setSearchValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMultiple = mode === "multiple" || mode === "tags";

  const selectedValue = value ?? innerValue;
  const selectedArray: string[] = isMultiple
    ? Array.isArray(selectedValue)
      ? selectedValue
      : selectedValue
        ? [selectedValue]
        : []
    : [];
  const selectedSingleValue = !isMultiple
    ? Array.isArray(selectedValue)
      ? selectedValue[0]
      : selectedValue
    : undefined;
  const selectedOption = !isMultiple
    ? options.find((option) => option.value === selectedSingleValue)
    : undefined;
  const selectedOptions = isMultiple
    ? selectedArray.map((item: string) => {
        const matched = options.find((option) => option.value === item);

        if (matched) {
          return matched;
        }

        return {
          label: item,
          text: item,
          value: item,
        };
      })
    : [];

  const mergedOptions = mode === "tags"
    ? [
        ...options,
        ...selectedOptions.filter(
          (selectedOptionItem: SelectOption) =>
            !options.some((option) => option.value === selectedOptionItem.value),
        ),
      ]
    : options;

  const filteredOptions = mergedOptions.filter((option) => {
    if ((!showSearch && !isMultiple) || searchValue.trim() === "") {
      return true;
    }

    const searchableText =
      option.text ?? (typeof option.label === "string" ? option.label : option.value);

    return searchableText.toLowerCase().includes(searchValue.trim().toLowerCase());
  });
  const reachedMaxCount =
    isMultiple && maxCount !== undefined && selectedArray.length >= maxCount;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (open && (showSearch || isMultiple)) {
      searchInputRef.current?.focus();
    }
  }, [isMultiple, open, showSearch]);

  function handleSelect(nextValue: string) {
    if (isMultiple) {
      const currentValues = selectedArray;
      const exists = currentValues.includes(nextValue);

      if (!exists && reachedMaxCount) {
        return;
      }

      const nextValues = exists
        ? currentValues.filter((item: string) => item !== nextValue)
        : [...currentValues, nextValue];

      if (value === undefined) {
        setInnerValue(nextValues);
      }

      onChange?.(nextValues);
      setSearchValue("");
      return;
    }

    if (value === undefined) {
      setInnerValue(nextValue);
    }

    onChange?.(nextValue);
    setSearchValue("");
    setOpen(false);
  }

  function handleRemove(valueToRemove: string) {
    if (!isMultiple) {
      return;
    }

    const nextValues = selectedArray.filter((item: string) => item !== valueToRemove);

    if (value === undefined) {
      setInnerValue(nextValues);
    }

    onChange?.(nextValues);
  }

  function handleCreateTag() {
    if (mode !== "tags") {
      return;
    }

    const trimmedValue = searchValue.trim();

    if (!trimmedValue || selectedArray.includes(trimmedValue) || reachedMaxCount) {
      return;
    }

    const nextValues = [...selectedArray, trimmedValue];

    if (value === undefined) {
      setInnerValue(nextValues);
    }

    onChange?.(nextValues);
    setSearchValue("");
  }

  const className = [
    "squid-select",
    `squid-select-${size}`,
    isMultiple && "squid-select-multiple",
    status && `squid-select-${status}`,
    open && "squid-select-open",
    disabled && "squid-select-disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} ref={rootRef}>
      <div
        className="squid-select-selector"
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen((current) => {
            const nextOpen = !current;

            if (!nextOpen) {
              setSearchValue("");
            }

            return nextOpen;
          });
        }}
      >
        {isMultiple ? (
          <div className="squid-select-selection-overflow">
            {selectedOptions.map((option) => (
              <span className="squid-select-tag" key={option.value}>
                <span className="squid-select-tag-label">{option.label}</span>
                <button
                  className="squid-select-tag-remove"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(option.value);
                  }}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="squid-select-search-input squid-select-selector-input"
              onChange={(event) => setSearchValue(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateTag();
                }

                if (
                  event.key === "Backspace" &&
                  searchValue === "" &&
                  selectedArray.length > 0
                ) {
                  handleRemove(selectedArray[selectedArray.length - 1]);
                }
              }}
              placeholder={selectedArray.length === 0 ? placeholder : undefined}
              ref={searchInputRef}
              value={searchValue}
            />
          </div>
        ) : open && showSearch ? (
          <input
            className="squid-select-search-input squid-select-selector-input"
            onChange={(event) => setSearchValue(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
              }
            }}
            placeholder={selectedOption ? undefined : placeholder}
            ref={searchInputRef}
            value={searchValue}
          />
        ) : (
          <span
            className={selectedOption ? "squid-select-value" : "squid-select-placeholder"}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        )}
        <span aria-hidden="true" className="squid-select-arrow">
          <ChevronDown />
        </span>
      </div>

      {open ? (
        <div className="squid-select-dropdown">
          {mode === "tags" &&
          searchValue.trim() !== "" &&
          !reachedMaxCount &&
          !filteredOptions.some((option: SelectOption) => option.value === searchValue.trim()) ? (
            <button
              className="squid-select-option"
              onClick={handleCreateTag}
              type="button"
            >
              {searchValue.trim()}
            </button>
          ) : null}

          {filteredOptions.length === 0 ? (
            <div className="squid-select-empty">No data</div>
          ) : null}

          {filteredOptions.map((option) => {
            const isSelected = isMultiple
              ? selectedArray.includes(option.value)
              : option.value === selectedSingleValue;
            const isOptionDisabled =
              !!option.disabled || (!!reachedMaxCount && isMultiple && !isSelected);

            return (
              <button
                className={[
                  "squid-select-option",
                  isSelected && "squid-select-option-selected",
                  isOptionDisabled && "squid-select-option-disabled",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={isOptionDisabled}
                key={option.value}
                onClick={() => handleSelect(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
