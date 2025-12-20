import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import { getMessages } from "@i18n/getMessages";
import { Locale } from "@type/props/common/globalTypes";
import { AppProviders } from "@lib/AppProviders";

export const metadata: Metadata = {
  title: "Praxy - správa odbornej praxe jednoducho",
  description:
    "CRM systém pre študentov, firmy a garantov. Správa praxí, dokumentov a stavov - bez papierovačiek.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale: Locale = "sk";
  const messages = await getMessages(locale, ["common", "auth"]);

  return (
    <html lang={locale}>
      <body>
        <AppProviders locale={locale} messages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
