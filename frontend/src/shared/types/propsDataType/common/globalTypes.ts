import IconName from "@icons/iconName";

export interface FaqData<TQ = string, TA = string> {
  q: TQ;
  a: TA;
}

export interface FeatureDatasItem {
  icon: IconName;
  title: string;
  text?: string;
}

export type Locale = "sk" | "en";

export type Action = "confirm" | "reject";

export interface Localized {
  byLocale: Record<Locale, string>;
  defaultLocale: Locale;
}
