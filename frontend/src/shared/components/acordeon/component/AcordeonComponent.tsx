import { FaqData } from "@/shared/types/faqTypes";
import React, { useState } from "react";

const AcordeonComponent = ({ data }: { data: FaqData[] }) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto">
      {data.map((it, i) => (
        <div key={it.q.idUsing()} className="border rounded-xl mb-3 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
          >
            <span className="font-medium">{it.q}</span>
            <span className="text-slate-400">{open === i ? "-" : "+"}</span>
          </button>
          {open === i && <div className="px-4 pb-4 text-sm text-slate-600">{it.a}</div>}
        </div>
      ))}
    </div>
  );
};

export default AcordeonComponent;
