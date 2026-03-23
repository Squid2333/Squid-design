import "./style.css";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

type TextSize = "sm" | "base" | "lg";
type TextType = "default" | "secondary" | "success" | "warning" | "danger";

type LinkProps = ComponentProps<"a"> & {
  children: ReactNode;
  size?: TextSize;
  textType?: TextType;
  disabled?: boolean;
  strong?: boolean;
  underline?: boolean;
  delete?: boolean;
  italic?: boolean;
};

export default function Link({
  children,
  size = "base",
  textType = "default",
  disabled = false,
  strong,
  underline = false,
  delete: del,
  italic,
  className,
  href,
  onClick,
  rel,
  tabIndex,
  target,
  ...rest
}: LinkProps) {
  const classNames = [
    "squid-text-base",
    "squid-link",
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

  const safeRel = target === "_blank" ? (rel ?? "noopener noreferrer") : rel;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  }

  return (
    <a
      aria-disabled={disabled || undefined}
      className={classNames}
      href={disabled ? undefined : href}
      onClick={handleClick}
      rel={safeRel}
      tabIndex={disabled ? -1 : tabIndex}
      target={target}
      {...rest}
    >
      {children}
    </a>
  );
}
