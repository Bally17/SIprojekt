import type { DoubleDataType, Variant } from "../core/common";
import type { IntegerOrNull } from "../core/primitives";

export type AcordeonComponentProps = {
  data: DoubleDataType[];
  variant?: Variant;
  defaultOpen?: IntegerOrNull;
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  chevronClassName?: string;
  contentClassName?: string;
};

export const accordionVariantClasses: Record<
  Variant,
  {
    wrapper: string;
    item: string;
    header: string;
    title: string;
    chevron: string;
    content: string;
  }
> = {
  light: {
    wrapper: "max-w-3xl mx-auto",
    item: "border rounded-xl mb-3 overflow-hidden bg-white text-ink-900",
    header: "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50",
    title: "font-medium",
    chevron: "text-slate-400",
    content: "px-4 pb-4 text-sm text-slate-600",
  },
  dark: {
    wrapper: "max-w-3xl mx-auto",
    item: "border rounded-xl mb-3 overflow-hidden",
    header: "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50",
    title: "font-medium",
    chevron: "text-slate-400",
    content: "px-4 pb-4 text-sm text-slate-600",
  },
};
