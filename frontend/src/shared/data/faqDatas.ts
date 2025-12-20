import { DoubleDataType } from "@shared-types/core/common";

export const faqDatas: DoubleDataType[] = [
  {
    a: "Ako funguje schvaľovanie praxe?",
    b: "Študent vytvorí žiadosť o prax, vyplní údaje o firme a odošle ju na schválenie. Firma potvrdí, že študenta prijíma, a garant následne overí súlad praxe s požiadavkami štúdia. O každom kroku systém informuje používateľov prostredníctvom notifikácií.",
  },
  {
    a: "Ako systém pracuje s dokumentmi a exportmi?",
    b: "Po vytvorení praxe systém automaticky vygeneruje potrebné dokumenty, napríklad dohodu o praxi vo formáte PDF. Pre potreby štatistiky a reportov je možné údaje o praxiach exportovať do CSV.",
  },
  {
    a: "Aké možnosti prihlásenia sú podporované?",
    b: "Používatelia sa prihlasujú prostredníctvom účtu vytvoreného v systéme. Po prihlásení majú prístup k svojim dashboardom podľa svojej role (študent, firma, garant).",
  },
  {
    a: "Je systém vhodný aj na používanie v mobile?",
    b: "Používateľské rozhranie je responzívne, takže študenti, firmy aj garanti môžu pracovať so systémom priamo v prehliadači na mobile alebo tablete bez nutnosti inštalácie samostatnej aplikácie.",
  },
] as const;
