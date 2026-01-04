// frontend/src/features/student/utils/getFirstErrorMessage.ts
import type { FieldErrors, FieldValues } from "react-hook-form";

type Options<T extends FieldValues> = {
  order?: (keyof T)[];
  fallback?: string;
};

export function getFirstErrorMessage<T extends FieldValues>(
  errs: FieldErrors<T>,
  options: Options<T> = {},
): string {
  const { order = [], fallback = "Skontrolujte vyplnene polia." } = options;

  const getMsg = (e: unknown) => {
    const msg = (e as any)?.message;
    return typeof msg === "string" && msg.trim() ? msg : null;
  };

  // 1) preferovaná priorita
  for (const key of order) {
    const msg = getMsg((errs as any)[key]);
    if (msg) return msg;
  }

  // 2) fallback: prvá správa v errors objekte
  for (const k of Object.keys(errs)) {
    const msg = getMsg((errs as any)[k]);
    if (msg) return msg;
  }

  return fallback;
}
