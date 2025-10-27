"use client";
import { GraduationCap, Building2, Shield, Puzzle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function RolesSection() {
  type Tab = "student" | "firma" | "garant" | "api";
  const [tab, setTab] = useState<Tab>("student");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "student", label: "Študent", icon: <GraduationCap className="h-4 w-4" /> },
    { key: "firma", label: "Firma", icon: <Building2 className="h-4 w-4" /> },
    { key: "garant", label: "Garant", icon: <Shield className="h-4 w-4" /> },
    { key: "api", label: "API", icon: <Puzzle className="h-4 w-4" /> },
  ];

  const rows: Record<Tab, { a: string; b: string }[]> = {
    student: [
      { a: "Vytvoriť prax (dohodnutie, firma, dátumy)", b: "Dohoda o odbornej praxi — Náhľad" },
      { a: "Generovať PDF „Dohoda o odbornej praxi“", b: "Študent • Firma • Garant" },
      { a: "Nahlásiť zmluvu (podmieň. pri stave Schválená)", b: "Zmluva s praxí (PDF) — upload" },
      { a: "Nahrať výkaz praxe (potvrdenie firmy)", b: "Výkaz praxe (nahranie)" },
    ],
    firma: [
      { a: "Schválenie dohody o praxi", b: "Podpis / potvrdenie" },
      { a: "Overenie výkazu praxe", b: "Komentár a potvrdenie" },
      { a: "Export reportov", b: "CSV / PDF" },
      { a: "Používateľské účty", b: "Roly a prístupy" },
    ],
    garant: [
      { a: "Kontrola a schvaľovanie", b: "Audit log" },
      { a: "Správa študentov", b: "Hľadanie, filtre" },
      { a: "Notifikácie", b: "E-mail / systémové" },
      { a: "Reporty", b: "Semestre / programy" },
    ],
    api: [
      { a: "OAuth 2.0", b: "Client credentials / PKCE" },
      { a: "Webhooky", b: "Stavy, uploady" },
      { a: "Integrácie", b: "Externý systém" },
      { a: "Dostupnosť", b: "Rate limits" },
    ],
  };

  return (
    <section id="roles" className="section">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">Role a prístupy</h2>
        <p className="text-ink-500 mb-6">Prepínaj roly a pozri ich oprávnenia a náhľad.</p>

        <div className="grid md:grid-cols-[220px,1fr] gap-5">
          <div className="card p-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b last:border-b-0 ${tab === t.key ? "bg-primary-50 text-primary-700 font-medium" : "hover:bg-slate-50"}`}
              >
                <span className="h-6 w-6 grid place-items-center rounded-full bg-slate-100">
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
            <div className="px-4 py-3 text-xs text-slate-500">
              Pozn.: Garant a Firma majú odlišné oprávnenia.
            </div>
          </div>

          <div className="card">
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 rounded-lg border text-sm ${tab === t.key ? "bg-primary-600 text-white border-primary-600" : "hover:bg-slate-50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-2">Oprávnenia roly</div>
                <ul className="space-y-2">
                  {rows[tab].map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary-600" />
                      <span>{r.a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">Náhľad rozhrania</div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="grid gap-2">
                    {rows[tab].map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <span className="text-sm">{r.b}</span>
                        <button className="btn btn-ghost text-xs">Akcia</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-primary text-sm">+ Vytvoriť prax</button>
                    <button className="btn btn-ghost text-sm">Generovať PDF</button>
                    <button className="btn btn-ghost text-sm">Náhľad</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
