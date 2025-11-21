import IconName from "@icons/iconName";

export interface FeatureDatasItem {
  icon: IconName;
  title: string;
}

export const featureDatas: readonly FeatureDatasItem[] = [
  { icon: "file-spreadsheet", title: "Evidencia praxí" },
  { icon: "workflow", title: "Workflow stavov" },
  { icon: "file-text", title: "Generovanie PDF" },
  { icon: "upload", title: "Nahrávanie dokumentov" },
  { icon: "download", title: "Export CSV" },
  { icon: "mail-check", title: "Notifikácie emailom" },
  { icon: "key-round", title: "API (OAuth 2.0)" },
  { icon: "filter", title: "Reporty / filtre" },
] as const;
