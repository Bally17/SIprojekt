import type { Locale } from "../core/common";

export interface LocalizedName {
  name: string;
  lang: Locale;
}

export interface TableColumn {
  columnName: Array<LocalizedName>;
}

export interface TableConfig {
  tableName: Array<LocalizedName>;
  columns: Array<TableColumn>;
  id?: number;
  tableSubtitle?: Array<LocalizedName>;
}
