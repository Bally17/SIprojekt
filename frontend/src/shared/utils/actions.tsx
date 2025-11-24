"use client";

import { Locale } from "@type/props/common/globalTypes";
import { TableNameValues } from "@type/props/table";
import { TableConfig } from "@type/props/tableConfig";
import { useEffect, useMemo, useState } from "react";

function pickName(items: readonly { name: string; lang: Locale }[] | undefined, lang: Locale) {
  if (!items?.length) return "";
  return items.find((i) => i.lang === lang)?.name ?? items[0]?.name ?? "";
}

export function useLoadTableData(name: TableNameValues, lang: Locale = "sk") {
  const [config, setConfig] = useState<TableConfig | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mod = await import("@table_config/index");
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
