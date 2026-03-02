import type { HTMLAttributes, ReactNode } from "react";

type PageContainerSize = "md" | "lg" | "xl";
type PageContainerTag = "div" | "section" | "main";

const sizeClasses: Record<PageContainerSize, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

type PageContainerProps = HTMLAttributes<HTMLElement> & {
  as?: PageContainerTag;
  size?: PageContainerSize;
  children?: ReactNode;
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function PageContainer({
  as = "main",
  size = "md",
  className,
  children,
  ...props
}: PageContainerProps) {
  const Tag = as;

  return (
    <Tag
      {...props}
      className={cx("w-full mx-auto px-4 sm:px-6 lg:px-8", sizeClasses[size], className)}
    >
      {children}
    </Tag>
  );
}

export default PageContainer;
