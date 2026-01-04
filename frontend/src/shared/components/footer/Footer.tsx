"use client";

import Image from "next/image";
import { useLocalization } from "@i18n/client";
import Link from "next/link";

//volitelný prop, určuje či sa zobrazia anchor odkazy, na landing je true inak false
type FooterProps = {
  showLandingLinks?: boolean;
};

export default function Footer({ showLandingLinks = true }: Readonly<FooterProps>) {
  const { msgs } = useLocalization();
  const year = String(new Date().getFullYear());
  return (
    <footer id="contact" className="bg-primary-600 text-white">
      <div className="container-wide py-12">
        <div className="flex items-center">
          <Image
            src="/images/logo_fpvai_footer.png"
            alt={msgs.common.brand.logoText}
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-8 text-sm">
          {showLandingLinks && (
            <div>
              <div className="font-semibold mb-3">{msgs.common.page.menu}</div>
              <ul className="space-y-2 text-white/80">
                <li>
                  <a href="#how-it-works" className="hover:underline">
                    {msgs.common.page.howItWorks}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:underline">
                    {msgs.common.page.features}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:underline">
                    {msgs.common.page.faq}
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:underline">
                    {msgs.common.page.contact}
                  </a>
                </li>
              </ul>
            </div>
          )}
          <div>
            <div className="font-semibold mb-3">{msgs.auth.loginRegister}</div>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/auth/login" className="hover:underline">
                  {msgs.auth.login}
                </Link>
              </li>
              <li>
                <Link href="/auth/register/student" className="hover:underline">
                  {msgs.auth.registerForStudent}
                </Link>
              </li>
              <li>
                <Link href="/auth/register/company" className="hover:underline">
                  {msgs.auth.registerForCompany}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">{msgs.common.page.mobile}</div>
            <div className="flex gap-3 opacity-90">
              <Image
                src="/images/game_14857377.png"
                alt="Store badge 1"
                width={64}
                height={64}
                className="h-12 w-12"
              />
              <Image
                src="/images/game_16566128.png"
                alt="Store badge 2"
                width={64}
                height={64}
                className="h-12 w-12"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-white/60">
          {msgs.common.brand.brand} {msgs.common.brand.copyright.replace("{year}", year)}
        </div>
      </div>
    </footer>
  );
}
