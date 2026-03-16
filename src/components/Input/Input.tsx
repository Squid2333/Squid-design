import "./style.css";
import { useEffect, useState } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";

type InputSize = "large" | "medium" | "small";
type InputVariant = "outlined" | "filled" | "borderless" | "underlined";
type InputStatus = "error" | "warning";

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> & {
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus;
  prefix?: ReactNode;
  showCount?: boolean;
  password?: boolean;
};

function getValueLength(value: InputHTMLAttributes<HTMLInputElement>["value"]) {
  if (value == null) {
    return 0;
  }

  return String(value).length;
}

export default function Input({
  className,
  size = "medium",
  variant = "outlined",
  status,
  prefix,
  showCount = false,
  password = false,
  disabled = false,
  value,
  defaultValue,
  onChange,
  maxLength,
  type,
  ...props
}: InputProps) {
  const [innerValueLength, setInnerValueLength] = useState(() =>
    getValueLength(value ?? defaultValue),
  );
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setInnerValueLength(getValueLength(value));
    }
  }, [value]);

  const wrapperClassName = [
    "squid-input-affix-wrapper",
    `squid-input-affix-wrapper-${size}`,
    `squid-input-affix-wrapper-${variant}`,
    status && `squid-input-affix-wrapper-${status}`,
    showCount && "squid-input-affix-wrapper-has-count",
    password && "squid-input-affix-wrapper-has-password",
    disabled && "squid-input-affix-wrapper-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setInnerValueLength(event.target.value.length);
    }

    onChange?.(event);
  }

  const countText =
    maxLength !== undefined
      ? `${innerValueLength}/${maxLength}`
      : `${innerValueLength}`;
  const inputType = password ? (passwordVisible ? "text" : "password") : type;

  return (
    <span className={wrapperClassName}>
      {prefix ? <span className="squid-input-prefix">{prefix}</span> : null}
      <input
        className="squid-input"
        defaultValue={defaultValue}
        disabled={disabled}
        maxLength={maxLength}
        onChange={handleChange}
        type={inputType}
        value={value}
        {...props}
      />

      {showCount ? (
        <span className="squid-input-count">{countText}</span>
      ) : null}
      {password ? (
        <button
          aria-label={passwordVisible ? "Hide password" : "Show password"}
          className="squid-input-password-toggle"
          disabled={disabled}
          onClick={() => setPasswordVisible((visible) => !visible)}
          tabIndex={-1}
          type="button"
        >
          {passwordVisible ? "Hide" : "Show"}
        </button>
      ) : null}
    </span>
  );
}
