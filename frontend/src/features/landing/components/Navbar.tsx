"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@components/button";
import { useLocalization } from "@i18n/client";

//volitelný prop, určuje či sa zobrazia anchor odkazy, na landing je true inak false
type NavbarProps = {
  showLandingLinks?: boolean;
};

export default function Navbar({ showLandingLinks = true }: Readonly<NavbarProps>) {
  const { msgs } = useLocalization();
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 bg-primary-50/90 backdrop-blur-md border-b border-primary-100 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Image
          src="/images/logo_fpvai.png"
          alt={msgs.common.brand.logoText}
          width={180}
          height={48}
          className="h-10 w-auto"
          priority
        />

        {showLandingLinks && (
          <nav className="hidden md:flex gap-8 text-ink-700 text-sm">
            <a
              href="#how-it-works"
              className="hover:text-primary-800 transition-colors duration-200"
            >
              {msgs.common.page.howItWorks}
            </a>
            <a href="#features" className="hover:text-primary-800 transition-colors duration-200">
              {msgs.common.page.features}
            </a>
            <a href="#faq" className="hover:text-primary-800 transition-colors duration-200">
              {msgs.common.page.faq}
            </a>
          </nav>
        )}

        <div className="hidden md:flex items-center gap-3 relative">
          <Link
            href="/auth/login"
            className="border border-primary-100 px-4 py-2 rounded-md text-sm text-ink-700 hover:bg-primary-50"
          >
            {msgs.auth.login}
          </Link>
          <Button
            type="button"
            variant="primary"
            className="px-4 py-2 rounded-md text-sm transition-all flex items-center gap-1"
            onClick={() => setRegisterOpen((prev) => !prev)}
            aria-expanded={registerOpen}
          >
            {msgs.auth.register} ▾
          </Button>
          {registerOpen && (
            <div className="absolute right-0 top-14 bg-paper border border-primary-100 rounded-md shadow-lg w-48 py-2 text-sm text-left">
              <Link href="/auth/register/student" className="block px-4 py-2 hover:bg-primary-50">
                {msgs.auth.registerStudent}
              </Link>
              <Link href="/auth/register/company" className="block px-4 py-2 hover:bg-primary-50">
                {msgs.auth.registerCompany}
              </Link>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          className="md:hidden text-ink-700 text-2xl p-1"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          title={menuOpen ? "Zavrieť menu" : "Otvoriť menu"}
        >
          {menuOpen ? "✕" : "☰"}
        </Button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-paper shadow-md flex flex-col text-center py-4 space-y-4 border-t border-primary-100">
          {showLandingLinks && (
            <>
              <a href="#how-it-works" className="text-ink-700 hover:text-primary-800">
                {msgs.common.page.howItWorks}
              </a>
              <a href="#features" className="text-ink-700 hover:text-primary-800">
                {msgs.common.page.features}
              </a>
              <a href="#faq" className="text-ink-700 hover:text-primary-800">
                {msgs.common.page.faq}
              </a>
            </>
          )}
          <Link
            href="/login"
            className="border border-primary-100 mx-auto px-4 py-2 rounded-md w-40 text-ink-700 hover:bg-primary-50"
          >
            {msgs.auth.login}
          </Link>
          <div className="space-y-2">
            <p className="text-ink-500 text-sm">{msgs.auth.register}</p>
            <Link
              href="/register/student"
              className="block border border-primary-100 mx-auto px-4 py-2 rounded-md w-40 text-ink-700 hover:bg-primary-50"
            >
              {msgs.auth.likeStudent}
            </Link>
            <Link
              href="/register/company"
              className="block bg-primary-900 text-white mx-auto px-4 py-2 rounded-md w-40 hover:bg-primary-800"
            >
              {msgs.auth.likeCompany}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
