import { TableConfig } from "@shared-types/ui/tableConfig";

const tableConfig = {
  tableName: [
    {
      name: "Aktuálne praxe",
      lang: "sk",
    },
    {
      name: "#",
      lang: "en",
    },
  ],
  tableSubtitle: [
    {
      name: "Detailný prehľad všetkých praxí vrátane stavu, firmy, študenta a obdobia.",
      lang: "sk",
    },
    {
      name: "#",
      lang: "en",
    },
  ],
  columns: [
    {
      columnName: [
        {
          name: "Študent",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Firma",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Program",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Obdobie",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Od",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Stav praxe",
          lang: "sk",
        },
        {
          name: "#",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Akcie",
          lang: "sk",
        },
        {
          name: "State",
          lang: "en",
        },
      ],
    },
  ],
} satisfies TableConfig;

export default tableConfig;
