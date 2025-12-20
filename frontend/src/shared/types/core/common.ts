import type IconName from "@icons/iconName";

export type RoleType = "student" | "company" | "garant";
export type StatusType = "nahrany" | "potvrdeny" | "zamietnuty";
export type Locale = "sk" | "en";
export type Action = "confirm" | "reject";
export type Variant = "light" | "dark";
export type SystemNotificationVariant = "success" | "info" | "warning";

export interface Localized {
  byLocale: Record<Locale, string>;
  defaultLocale: Locale;
}

export interface DoubleDataType<TQ = string, TA = string> {
  a: TQ;
  b: TA;
}

export interface FeatureDatasItem {
  icon: IconName;
  title: string;
  text?: string;
}

export type ResetPasswordFormState = {
  newPassword: string;
  confirmPassword: string;
};
