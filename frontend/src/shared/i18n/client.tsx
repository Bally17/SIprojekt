"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Messages } from "@i18n/getMessages";
import { Locale } from "@shared-types/core/common";

type Ctx = { locale: Locale; messages: Messages };
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

export function LocalizationProvider(props: React.PropsWithChildren<Ctx>) {
  const { locale, messages, children } = props;

  const value = useMemo<Ctx>(() => ({ locale, messages }), [locale, messages]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useLocalization() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useLocalization must be used within <LocalizationProvider>");
  const msgs = useMemo(() => makeMsgsProxy(ctx.messages), [ctx.messages]);
  return { locale: ctx.locale, msgs };
}
