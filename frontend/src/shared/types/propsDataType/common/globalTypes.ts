export interface FaqData<TQ = string, TA = string> {
  q: TQ;
  a: TA;
}

export type Locale = "sk" | "en";

export type Action = "confirm" | "reject";

export interface Localized {
  byLocale: Record<Locale, string>;
  defaultLocale: Locale;
}
