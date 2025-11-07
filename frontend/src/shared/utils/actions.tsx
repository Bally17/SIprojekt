"use client";

import { useEffect, useMemo, useState } from "react";
import type TableConfig from "@/shared/types/tableConfig/TableConfig";
import type { TableNameValues } from "@/shared/types/components/table/components/TableNameValues";
export type Lang = "sk" | "en";

function pickName(items: readonly { name: string; lang: Lang }[] | undefined, lang: Lang) {
  if (!items?.length) return "";
  return items.find((i) => i.lang === lang)?.name ?? items[0]?.name ?? "";
}

export function useLoadTableData(name: TableNameValues, lang: Lang = "sk") {
  const [config, setConfig] = useState<TableConfig | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mod = await import("@/shared/tableConfig");
        const cfg = (mod as Record<string, unknown>)[name] as TableConfig | undefined;

        if (!cfg) throw new Error(`Unknown table config: ${name}`);
        if (alive) setConfig(cfg);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [name]);

  const title = useMemo(() => (config ? pickName(config.tableName, lang) : ""), [config, lang]);

  const subTitle = useMemo(
    () => (config ? pickName(config.tableSubtitle, lang) : ""),
    [config, lang],
  );

  const columns = useMemo(
    () => (config ? config.columns.map((c) => pickName(c.columnName, lang)) : []),
    [config, lang],
  );

  return { loading, error, config, title, columns, lang, subTitle };
}

export default useLoadTableData;
