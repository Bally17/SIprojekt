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

// import type { Locale } from "../core/common";

// export interface LocalizedName {
//   name: string;
//   lang: Locale;
// }

// export type TableColumnType =
//   | "text"
//   | "student" // meno + email
//   | "term" // rok + semester + datum range
//   | "stavBadge" // badge zo stav
//   | "actions"; // akcie (edit/approve/reject)

// export interface TableColumnConfig {
//   columnName: Array<LocalizedName>;
//   type?: TableColumnType;
//   key: string;
// }

// export interface TableConfig {
//   tableName: Array<LocalizedName>;
//   columns: Array<TableColumnConfig>;
//   id?: number;
//   tableSubtitle?: Array<LocalizedName>;
// }
