import { FaqData } from "@type/props/common/globalTypes";

export const faqDatas: FaqData[] = [
  {
    q: "Ako prebieha schvaľovanie praxe?",
    a: "Študent vytvorí žiadosť, firma potvrdí a garant skontroluje. Systém posiela notifikácie.",
  },
  {
    q: "Je možné generovať PDF a exportovať CSV?",
    a: "Áno, všetky dokumenty vieš generovať a exporty CSV sú dostupné pre reporty.",
  },
  {
    q: "Podporujete prihlásenie cez univerzitný účet?",
    a: "Áno, vieme pridať OAuth2 / SSO podľa potrieb školy.",
  },
  {
    q: "Je aplikácia dostupná v mobile?",
    a: "Rozhranie je plne responzívne; neskôr vieme pridať PWA či mobilné appky.",
  },
] as const;
