// \src\lib\AppProviders.tsx
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@lib/QueryProvider";
import { LocalizationProvider } from "@i18n/client";
import { SystemNotificationsProvider } from "@components/notifications";
import type { Locale } from "@type/props/common/globalTypes";
import { AuthProvider } from "./AuthProvider";

type Props = {
  children: ReactNode;
  locale: Locale;
  messages: any;
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
