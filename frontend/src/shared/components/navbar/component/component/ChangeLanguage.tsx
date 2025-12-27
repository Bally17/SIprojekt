import { Button } from "@components/button";
import { useLanguageOptions } from "src/constants/languageOptions";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { Locale } from "@shared-types/index";
import Image from "next/image";
import React, { useState } from "react";

export const ChangeLanguage = () => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Locale>("sk");

  const { msgs } = useLocalization();
  const options = useLanguageOptions();

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setLangMenuOpen((prev) => !prev)}
        aria-label={msgs.common.language.switcher}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white-50 hover:bg-primary-100"
      >
        <Icon name="globe" className="h-5 w-5" />
      </Button>

      {langMenuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-primary-50 shadow-xl ring-1 ring-black/5">
          {options.map((opt) => {
            const isActive = opt.locale === activeLocale;

            return (
              <Button
                key={opt.locale}
                type="button"
                className={[
                  "group flex w-full items-center gap-3 px-3 py-2.5 text-left text-slate-800 hover:bg-primary-100 border-none",
                  isActive ? "bg-primary-100" : "bg-primary-50",
                ].join(" ")}
                onClick={() => {
                  setActiveLocale(opt.locale);
                  setLangMenuOpen(false);
                }}
              >
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-200 bg-white"
                  aria-hidden="true"
                >
                  <Image
                    src={opt.flagSrc}
                    alt={opt.flagAlt}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-cover"
                  />
                </span>

                <span className="flex-1 text-sm font-medium">{opt.label}</span>

                <span
                  className={[
                    "ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-primary-700 transition",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};
