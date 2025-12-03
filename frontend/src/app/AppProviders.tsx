"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@lib/query-provider";
import { LocalizationProvider } from "@i18n/client";
import { SystemNotificationsProvider } from "@components/notifications";
import type { Locale } from "@type/props/common/globalTypes";
import { AuthProvider } from "@constants";

type Props = {
  children: ReactNode;
  locale: Locale;
  messages: any; // alebo presnejší typ podľa tvojho i18n
};

export function AppProviders({ children, locale, messages }: Readonly<Props>) {
  return (
    <QueryProvider>
      <LocalizationProvider locale={locale} messages={messages}>
        <SystemNotificationsProvider>
          <AuthProvider>{children}</AuthProvider>
        </SystemNotificationsProvider>
      </LocalizationProvider>
    </QueryProvider>
  );
}
