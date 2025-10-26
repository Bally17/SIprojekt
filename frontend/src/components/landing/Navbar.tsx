"use client";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-blue-900">
          <div className="bg-blue-800 text-white rounded-md px-2 py-1">P</div>
          Praxy
        </div>

        <nav className="hidden md:flex gap-8 text-gray-700 text-sm">
          {["Ako to funguje", "Funkcie", "FAQ", "Kontakt"].map((link) => (
            <a
              key={link}
              href="#"
              className="hover:text-blue-800 transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button className="border px-4 py-2 rounded-md text-sm hover:bg-gray-100">
            Prihlásiť sa
          </button>
          <button className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800 transition-all">
            Registrácia
          </button>
        </div>

        {/* Mobilné menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 text-2xl"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white shadow-md flex flex-col text-center py-4 space-y-4 border-t">
          {["Ako to funguje", "Funkcie", "FAQ", "Kontakt"].map((item) => (
            <a key={item} href="#" className="text-gray-700 hover:text-blue-800">
              {item}
            </a>
          ))}
          <button className="border mx-auto px-4 py-2 rounded-md w-40">
            Prihlásiť sa
          </button>
          <button className="bg-blue-900 text-white mx-auto px-4 py-2 rounded-md w-40">
            Registrácia
          </button>
        </div>
      )}
    </header>
  );
}
