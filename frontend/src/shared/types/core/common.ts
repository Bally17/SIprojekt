import type IconName from "@icons/iconName";
import { DocumentStatusType } from "@shared-types/documentStatus";

export type RoleType = "student" | "company" | "garant";
export type StatusType = DocumentStatusType;
export type Locale = "sk" | "en";
export type Action = "confirm" | "reject";
export type Variant = "light" | "dark";
export type SystemNotificationVariant = "success" | "info" | "warning";
export type OAuthStatus = "pending" | "success" | "error" | "existing";

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
