"use client";
import { useLocalization } from "@/shared/i18n/client";

export default function Footer() {
  const { msgs } = useLocalization();
  const year = String(new Date().getFullYear());
  return (
    <footer id="contact" className="bg-night text-white">
      <div className="container-wide py-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white grid place-items-center text-night font-bold">
            {msgs.common.brand.logoLetter}
          </div>
          <span className="text-xl font-semibold">{msgs.common.brand.logoText}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-8 text-sm">
          <div>
            <div className="font-semibold mb-3">{msgs.common.page.menu}</div>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#how" className="hover:underline">
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
          <div>
            <div className="font-semibold mb-3">{msgs.auth.loginRegister}</div>
            <ul className="space-y-2 text-white/80">
              <li>{msgs.auth.login}</li>
              <li>{msgs.auth.registerForStudent}</li>
              <li>{msgs.auth.registerForCompany}</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">{msgs.common.page.mobile}</div>
            <div className="flex gap-3 opacity-80">
              <div className="h-10 w-32 rounded-lg bg-white/10 grid place-items-center">
                {msgs.common.page.appStore}
              </div>
              <div className="h-10 w-32 rounded-lg bg-white/10 grid place-items-center">
                {msgs.common.page.googlePlay}
              </div>
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
