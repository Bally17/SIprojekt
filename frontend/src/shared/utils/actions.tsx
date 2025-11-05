"use client";

import { useEffect, useMemo, useState } from "react";
import type TableConfig from "@/shared/types/tableConfig/TableConfig";
import { TABLE_NAMES } from "@/constants/Table";
export type TableName = (typeof TABLE_NAMES)[keyof typeof TABLE_NAMES];
export type Lang = "sk" | "en";

const loaders: Record<TableName, () => Promise<TableConfig>> = {
  [TABLE_NAMES.ALL_INTERNSHIPS]: () =>
    import("@/shared/tableConfig/configs/AllInternships").then((m) => m.default),
};

function pickName(items: readonly { name: string; lang: Lang }[], lang: Lang) {
  return items.find((i) => i.lang === lang)?.name ?? items[0]?.name ?? "";
}

export function useLoadTabelData(name: TableName, lang: Lang = "sk") {
  const [config, setConfig] = useState<TableConfig | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    const load = loaders[name]; // žiadny switch 🙂
    (load ? load() : Promise.reject(new Error(`Unknown table config: ${name}`)))
      .then((cfg) => {
        if (alive) setConfig(cfg);
      })
      .catch((e) => {
        if (alive) setError(e);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [name]);

  const title = useMemo(() => (config ? pickName(config.tableName, lang) : ""), [config, lang]);

  const columns = useMemo(
    () => (config ? config.columns.map((c) => pickName(c.columnName, lang)) : []),
    [config, lang],
  );

  return { loading, error, config, title, columns, lang };
}

export default useLoadTabelData;
