import "./style.css";
import type { ComponentProps, ReactNode } from "react";

type TitleLevel = 1 | 2 | 3 | 4 | 5;

type TitleProps = ComponentProps<"h1"> & {
  children: ReactNode;
  level?: TitleLevel;
};

export default function Title({
  children,
  level = 1,
  className,
  ...rest
}: TitleProps) {
  const titleTags = {
    1: "h1",
    2: "h2",
    3: "h3",
    4: "h4",
    5: "h5",
  } as const;

  const Tag = titleTags[level];
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
}
