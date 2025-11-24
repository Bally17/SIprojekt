import React, { useState } from "react";
import "@utils/idUsing";
import {
  AcordeonComponentProps,
  variantClasses,
} from "@type/props/acordeon/AcordeonComponentProps";

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
  const v = variantClasses[variant];
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className={className ?? v.wrapper}>
      {data.map((it, i) => (
        <div key={it.q.idUsing()} className={itemClassName ?? v.item}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className={headerClassName ?? v.header}
          >
            <span className={titleClassName ?? v.title}>{it.q}</span>
            <span className={chevronClassName ?? v.chevron} aria-hidden>
              {open === i ? "-" : "+"}
            </span>
          </button>
          {open === i && <div className={contentClassName ?? v.content}>{it.a}</div>}
        </div>
      ))}
    </div>
  );
};

export default AcordeonComponent;
