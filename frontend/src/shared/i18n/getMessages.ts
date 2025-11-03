// src/shared/i18n/getMessages.ts
export type Locale = "sk" | "en";
export type Messages = Record<string, any>;

export async function getMessages(locale: Locale, namespaces: string[] = []) {
  const common = (await import(`@shared/i18n/locales/${locale}/common.json`)).default;

  const entries: [string, any][] = [["common", common]];
  for (const ns of namespaces) {
    try {
      const mod = (await import(`@shared/i18n/locales/${locale}/${ns}.json`)).default;
      entries.push([ns, mod]);
    } catch {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing namespace file: locales/${locale}/${ns}.json`);
      }
      entries.push([ns, {}]);
    }
  }

  return Object.fromEntries(entries) as Messages;
}
