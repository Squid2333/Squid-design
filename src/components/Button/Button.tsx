import "./style.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonType = "primary" | "default" | "dashed" | "text" | "link";
type ButtonColor = "default" | "primary" | "danger";
type ButtonVariant = "solid" | "outlined" | "dashed" | "text" | "link";
type ButtonSize = "large" | "medium" | "small";
type ButtonShape = "default" | "circle";
type NativeButtonType = NonNullable<
  ButtonHTMLAttributes<HTMLButtonElement>["type"]
>;

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "color"
> & {
  type?: ButtonType;
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
  htmlType?: NativeButtonType;
};

function resolvePreset(
  type: ButtonType | undefined,
  color: ButtonColor | undefined,
  variant: ButtonVariant | undefined,
) {
  if (!type) {
    return {
      color: color ?? "default",
      variant: variant ?? "outlined",
    };
  }

  const presetMap: Record<
    ButtonType,
    { color: ButtonColor; variant: ButtonVariant }
  > = {
    primary: { color: "primary", variant: "solid" },
    default: { color: "default", variant: "outlined" },
    dashed: { color: "default", variant: "dashed" },
    text: { color: "default", variant: "text" },
    link: { color: "primary", variant: "link" },
  };

  return presetMap[type];
}

export default function Button({
  children,
  className,
  type,
  color,
  variant,
  size = "medium",
  shape = "default",
  icon,
  loading = false,
  block = false,
  htmlType = "button",
  disabled = false,
  ...props
}: ButtonProps) {
  const resolved = resolvePreset(type, color, variant);
  const isDisabled = disabled || loading;

  const classes = [
    "squid-btn",
    `squid-btn-${resolved.variant}`,
    `squid-btn-${resolved.color}`,
    `squid-btn-${size}`,
    shape === "circle" && "squid-btn-circle",
    block && "squid-btn-block",
    loading && "squid-btn-loading",
    isDisabled && "squid-btn-disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={isDisabled} type={htmlType} {...props}>
      {loading ? <span aria-hidden="true" className="squid-btn-spinner" /> : null}
      {!loading && icon ? <span className="squid-btn-icon">{icon}</span> : null}
      {children}
    </button>
  );
}
