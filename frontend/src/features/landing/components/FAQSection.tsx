"use client";
import { useLocalization } from "@/shared/i18n/client";
import { useState } from "react";

export default function FAQSection() {
  const { msgs } = useLocalization();
  const items = [
    {
      q: "Ako prebieha schvaľovanie praxe?",
      a: "Študent vytvorí žiadosť, firma potvrdí a garant skontroluje. Systém posiela notifikácie.",
    },
    {
      q: "Je možné generovať PDF a exportovať CSV?",
      a: "Áno, všetky dokumenty vieš generovať a exporty CSV sú dostupné pre reporty.",
    },
    {
      q: "Podporujete prihlásenie cez univerzitný účet?",
      a: "Áno, vieme pridať OAuth2 / SSO podľa potrieb školy.",
    },
    {
      q: "Je aplikácia dostupná v mobile?",
      a: "Rozhranie je plne responzívne; neskôr vieme pridať PWA či mobilné appky.",
    },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section">
      <div className="container-wide">
        <div className="text-center mb-10">
          <div className="text-primary-700 font-semibold">{msgs.common.page.faq}</div>
          <h2 className="text-3xl font-bold text-ink-900 mt-2">{msgs.common.page.faqTitle}</h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {items.map((it, i) => (
            <div key={i} className="border rounded-xl mb-3 overflow-hidden">
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
      </div>
    </section>
  );
}
