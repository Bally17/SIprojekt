"use client";
import { useState } from "react";

export default function RolesSection() {
  const [role, setRole] = useState("Študent");

  const roles = ["Študent", "Firma", "Garant praxe", "Externý systém"];

  const roleData: Record<string, string[]> = {
    Študent: [
      "Vytvoriť prax (študent, firma, dátumy)",
      "Generovať PDF 'Dohoda o odbornej praxi'",
      "Nahrať zmluvu (povinne po schválení)",
      "Nahrať výkaz praxe (potvrdený firmou)",
    ],
    Firma: [
      "Schváliť prax študenta",
      "Podpísať dohodu o praxi",
      "Vložiť poznámky k priebehu praxe",
      "Potvrdiť výkaz praxe",
    ],
    "Garant praxe": [
      "Kontrola údajov o praxi",
      "Schváliť alebo zamietnuť prax",
      "Vytvoriť reporty pre fakultu",
      "Exportovať údaje do CSV",
    ],
    "Externý systém": [
      "Integrácia pomocou API",
      "OAuth 2.0 prístup",
      "Automatizovaný export dát",
      "Bezpečný prenos dokumentov",
    ],
  };

  return (
    <section className="py-20 bg-gray-50" id="roles">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Role a prístupy</h2>
        <p className="text-gray-600 mb-10">Prepínaj role a pozri ich oprávnenia a náhľad.</p>

        {/* prepínač */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-6 py-2 rounded-full border transition-all ${
                role === r
                  ? "bg-blue-900 text-white border-blue-900 shadow-md"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* obsah */}
        <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl mx-auto transition-all">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">Oprávnenia pre: {role}</h3>
          <ul className="text-left space-y-3 text-gray-700">
            {roleData[role].map((item, index) => (
              <li key={index} className="flex items-center gap-3 hover:text-blue-800 transition">
                <span className="text-blue-600 font-bold">•</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
