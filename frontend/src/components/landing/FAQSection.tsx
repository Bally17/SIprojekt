"use client";
import { useState } from "react";

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    { q: "Ako sa môžem zaregistrovať?", a: "Klikni na tlačidlo Registrácia a vyber si rolu." },
    { q: "Ako funguje schvaľovanie?", a: "Firma a garant postupne kontrolujú a potvrdzujú prax." },
    { q: "Je možné upraviť údaje o praxi?", a: "Áno, pokiaľ nebola prax ešte schválená garantom." },
    { q: "Ako vygenerujem PDF dohodu?", a: "V sekcii praxe klikni na tlačidlo 'Generovať dohodu'." },
    { q: "Dá sa exportovať do CSV?", a: "Áno, dáta o praxiach vieš exportovať jedným kliknutím." },
  ];

  return (
    <section className="py-20 bg-gray-50" id="faq">
      <h2 className="text-center text-3xl font-bold text-gray-900 mb-12">Často kladené otázky</h2>
      <div className="max-w-3xl mx-auto space-y-4 px-6">
        {faqs.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all"
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="w-full text-left px-6 py-4 flex justify-between items-center text-gray-800 font-medium hover:bg-gray-50 transition"
            >
              {item.q}
              <span className="text-blue-700 text-2xl">{open === index ? "−" : "+"}</span>
            </button>
            {open === index && (
              <div className="px-6 pb-4 text-gray-600">{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
