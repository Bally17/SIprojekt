"use client";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-primary-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-2xl font-bold text-primary-900">
          <div className="bg-primary-800 text-white rounded-md px-2 py-1">P</div>
          Praxy
        </div>

        <nav className="hidden md:flex gap-8 text-ink-700 text-sm">
          <a href="#how-it-works" className="hover:text-primary-800 transition-colors duration-200">
            Ako to funguje
          </a>
          <a href="#features" className="hover:text-primary-800 transition-colors duration-200">
            Funkcie
          </a>
          <a href="#faq" className="hover:text-primary-800 transition-colors duration-200">
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3 relative">
          <Link
            href="/auth/login"
            className="border border-primary-100 px-4 py-2 rounded-md text-sm text-ink-700 hover:bg-primary-50"
          >
            Prihlásiť sa
          </Link>
          <button
            onClick={() => setRegisterOpen((prev) => !prev)}
            className="bg-primary-900 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-800 transition-all flex items-center gap-1"
          >
            Registrácia ▾
          </button>
          {registerOpen && (
            <div className="absolute right-0 top-14 bg-paper border border-primary-100 rounded-md shadow-lg w-48 py-2 text-sm text-left">
              <Link href="/auth/register/student" className="block px-4 py-2 hover:bg-primary-50">
                Registrácia študenta
              </Link>
              <Link href="/auth/register/company" className="block px-4 py-2 hover:bg-primary-50">
                Registrácia firmy
              </Link>
            </div>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-ink-700 text-2xl">
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-paper shadow-md flex flex-col text-center py-4 space-y-4 border-t border-primary-100">
          <a href="#how-it-works" className="text-ink-700 hover:text-primary-800">
            Ako to funguje
          </a>
          <a href="#features" className="text-ink-700 hover:text-primary-800">
            Funkcie
          </a>
          <a href="#faq" className="text-ink-700 hover:text-primary-800">
            FAQ
          </a>
          <Link
            href="/login"
            className="border border-primary-100 mx-auto px-4 py-2 rounded-md w-40 text-ink-700 hover:bg-primary-50"
          >
            Prihlásiť sa
          </Link>
          <div className="space-y-2">
            <p className="text-ink-500 text-sm">Registrácia</p>
            <Link
              href="/register/student"
              className="block border border-primary-100 mx-auto px-4 py-2 rounded-md w-40 text-ink-700 hover:bg-primary-50"
            >
              Ako študent
            </Link>
            <Link
              href="/register/company"
              className="block bg-primary-900 text-white mx-auto px-4 py-2 rounded-md w-40 hover:bg-primary-800"
            >
              Ako firma
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
