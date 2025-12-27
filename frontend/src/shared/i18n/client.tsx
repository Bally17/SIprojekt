"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Messages } from "@i18n/getMessages";
import { Locale } from "@shared-types/core/common";

type Ctx = {
  locale: Locale;
  messages: Messages;
  setLocale: (next: Locale) => Promise<void>;
  isLoading: boolean;
};

const I18nCtx = createContext<Ctx | null>(null);

const getByPath = (obj: any, path: string) =>
  path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);

function makeMsgsProxy(root: Messages) {
  const mk = (base: string[]): any =>
    new Proxy(
      {},
      {
        get(_t, prop: string) {
          const seg = String(prop);
          const key = [...base, seg].join(".");
          let val = getByPath(root, key);
          if (val == null && base.length === 0) val = getByPath(root, `common.${seg}`);
          if (val == null) {
            if (process.env.NODE_ENV !== "production") console.warn(`[i18n] Missing key: ${key}`);
            return key;
          }
          return typeof val === "object" ? mk([...base, seg]) : String(val);
        },
      },
    );
  return mk([]);
}

type ProviderProps = React.PropsWithChildren<{
  locale: Locale;
  messages: Messages;
  loadMessages: (locale: Locale) => Promise<Messages>;
}>;

export function LocalizationProvider(props: ProviderProps) {
  const { locale: initialLocale, messages: initialMessages, loadMessages, children } = props;

  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);

  // ak sa zmenia initial props (napr. po refreshi), zosynchronizuj
  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;

      setIsLoading(true);
      try {
        const nextMessages = await loadMessages(next);
        setLocaleState(next);
        setMessages(nextMessages);
      } finally {
        setIsLoading(false);
      }
    },
    [locale, loadMessages],
  );

  const value = useMemo<Ctx>(
    () => ({ locale, messages, setLocale, isLoading }),
    [locale, messages, setLocale, isLoading],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useLocalization() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useLocalization must be used within <LocalizationProvider>");
  const msgs = useMemo(() => makeMsgsProxy(ctx.messages), [ctx.messages]);
  return { locale: ctx.locale, msgs, setLocale: ctx.setLocale, isLoading: ctx.isLoading };
}
