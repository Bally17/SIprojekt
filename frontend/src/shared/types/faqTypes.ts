export interface FaqData<TQ = string, TA = string> {
  q: TQ;
  a: TA;
}

export type Locale = "sk" | "en";
export interface Localized {
  byLocale: Record<Locale, string>;
  defaultLocale: Locale;
}
