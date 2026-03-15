import "./style.css";
import type { ComponentProps, ReactNode } from "react";

type TextSize = "sm" | "base" | "lg";
type TextType = "default" | "secondary" | "success" | "warning" | "danger";

type TextProps = ComponentProps<"span"> & {
  children: ReactNode;
  size?: TextSize;
  textType?: TextType;
  disabled?: boolean;
  strong?: boolean;
  underline?: boolean;
  delete?: boolean;
  italic?: boolean;
};

export default function Text({
  children,
  size = "base",
  textType = "default",
  disabled = false,
  strong,
  underline,
  delete: del,
  italic,
  className,
  ...rest
}: TextProps) {
  const classNames = [
    "squid-text-base",
    size !== "base" && `squid-text-${size}`,
    textType !== "default" && `squid-text-${textType}`,
    disabled && "squid-text-disabled",
    strong && "squid-text-strong",
    underline && "squid-text-underline",
    del && "squid-text-delete",
    italic && "squid-text-italic",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span aria-disabled={disabled || undefined} className={classNames} {...rest}>
      {children}
    </span>
  );
}
