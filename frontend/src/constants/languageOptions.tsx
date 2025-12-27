import { useLocalization } from "@i18n/client";
import { Locale } from "@shared-types/index";

export type LangOption = {
  locale: Locale;
  label: string;
  flagSrc: string;
  flagAlt: string;
};

export const useLanguageOptions = (): LangOption[] => {
  const { msgs } = useLocalization();

  return [
    {
      locale: "sk",
      label: msgs.common.language.sk,
      flagSrc: "/images/countries/SlovakiaFlag.png",
      flagAlt: "Slovakia",
    },
    {
      locale: "en",
      label: msgs.common.language.en,
      flagSrc: "/images/countries/EnglandFlag.png",
      flagAlt: "United Kingdom",
    },
  ];
};
