import React, { FC, useState } from "react";
import type { FaqData } from "@/shared/types/faqTypes";
import "@utils/idUsing";
import { Button } from "../../button";

type Variant = "light" | "dark";

type AcordeonComponentProps = {
  data: FaqData[];
  variant?: Variant;
  defaultOpen?: number | null;
  className?: string;
  itemClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  chevronClassName?: string;
  contentClassName?: string;
};

const variantClasses: Record<
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

const AcordeonComponent: FC<AcordeonComponentProps> = ({
  data,
  variant = "light",
  defaultOpen = null,
  className,
  itemClassName,
  headerClassName,
  titleClassName,
  chevronClassName,
  contentClassName,
}) => {
  const v = variantClasses[variant];
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className={className ?? v.wrapper}>
      {data.map((it, i) => (
        <div key={it.q.idUsing()} className={itemClassName ?? v.item}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(open === i ? null : i)}
            className={headerClassName ?? v.header}
            aria-expanded={open === i}
            aria-controls={`faq-panel-${i}`}
            id={`faq-header-${i}`}
          >
            <span className={titleClassName ?? v.title}>{it.q}</span>
            <span className={chevronClassName ?? v.chevron} aria-hidden>
              {open === i ? "−" : "+"}
            </span>
          </Button>
          {open === i && <div className={contentClassName ?? v.content}>{it.a}</div>}
        </div>
      ))}
    </div>
  );
};

export default AcordeonComponent;
