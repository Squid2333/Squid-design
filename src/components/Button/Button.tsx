import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "default";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export default function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const classes = ["btn", `btn-${variant}`, className].filter(Boolean).join(" ");

  return <button className={classes} type={type} {...props} />;
}
