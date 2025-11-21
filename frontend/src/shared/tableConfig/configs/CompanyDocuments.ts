import { TableConfig } from "@type/props/tableConfig";

const tableConfig: TableConfig = {
  tableName: [
    { name: "Výkazy a dokumenty", lang: "sk" },
    { name: "Reports & Documents", lang: "en" },
  ],
  tableSubtitle: [
    {
      name: "Spracujte nahrané výkazy – skontrolujte stav a vykonajte akcie.",
      lang: "sk",
    },
    {
      name: "Review uploaded reports – check their status and take action.",
      lang: "en",
    },
  ],
  columns: [
    {
      columnName: [
        { name: "Študent", lang: "sk" },
        { name: "Student", lang: "en" },
      ],
    },
    {
      columnName: [
        { name: "Obdobie", lang: "sk" },
        { name: "Term", lang: "en" },
      ],
    },
    {
      columnName: [
        { name: "Dokument", lang: "sk" },
        { name: "Document", lang: "en" },
      ],
    },
    {
      columnName: [
        { name: "Stav", lang: "sk" },
        { name: "Status", lang: "en" },
      ],
    },
    {
      columnName: [
        { name: "Akcie", lang: "sk" },
        { name: "Actions", lang: "en" },
      ],
    },
  ],
};

export default tableConfig;
