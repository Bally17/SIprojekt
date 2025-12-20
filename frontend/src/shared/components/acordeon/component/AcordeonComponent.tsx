import React, { useState } from "react";
import "@utils/idUsing";
import { IntegerOrNull } from "@shared-types/core/primitives";
import { accordionVariantClasses, AcordeonComponentProps } from "@shared-types/ui/accordion";

export const AcordeonComponent = ({
  data,
  variant = "light",
  defaultOpen = null,
  className,
  itemClassName,
  headerClassName,
  titleClassName,
  chevronClassName,
  contentClassName,
}: AcordeonComponentProps) => {
  const v = accordionVariantClasses[variant];
  const [open, setOpen] = useState<IntegerOrNull>(defaultOpen);

  return (
    <div className={className ?? v.wrapper}>
      {data.map((it, i) => (
        <div key={it.a.idUsing()} className={itemClassName ?? v.item}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className={headerClassName ?? v.header}
          >
            <span className={titleClassName ?? v.title}>{it.a}</span>
            <span className={chevronClassName ?? v.chevron} aria-hidden>
              {open === i ? "-" : "+"}
            </span>
          </button>
          {open === i && <div className={contentClassName ?? v.content}>{it.b}</div>}
        </div>
      ))}
    </div>
  );
};

export default AcordeonComponent;
