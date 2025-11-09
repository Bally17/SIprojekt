import type { Metadata } from "next";
import "./globals.css";

import type { ReactNode } from "react";
import { getMessages, type Locale } from "@i18n/getMessages";
import { LocalizationProvider } from "@i18n/client";
import { SystemNotificationsProvider } from "@/shared/components/notifications";

export const metadata: Metadata = {
  title: "Praxy – správa odbornej praxe jednoducho",
  description:
    "CRM systém pre študentov, firmy a garantov. Správa praxí, dokumentov a stavov – bez papierovačiek.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale: Locale = "sk";
  const messages = await getMessages(locale, ["common", "auth"]);

  return (
    <html lang={locale}>
      <body>
        <LocalizationProvider locale={locale} messages={messages}>
          <SystemNotificationsProvider>{children}</SystemNotificationsProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
