import type { Messages } from "@i18n/getMessages";
import type { Locale } from "@shared-types/core/common";

export async function loadMessagesClient(locale: Locale): Promise<Messages> {
  const l: Locale = locale === "en" ? "en" : "sk";

  const [common, auth] = await Promise.all([
    import(`./locales/${l}/common.json`).then((m) => m.default),
    import(`./locales/${l}/auth.json`).then((m) => m.default),
  ]);

  return { common, auth } as Messages;
}
