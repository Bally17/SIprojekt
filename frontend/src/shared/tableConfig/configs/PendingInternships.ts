import { TableConfig } from "@type/props/tableConfig";

const tableConfig: TableConfig = {
  tableName: [
    {
      name: "Čakajúce praxe",
      lang: "sk",
    },
    {
      name: "Pending internships",
      lang: "en",
    },
  ],
  tableSubtitle: [
    {
      name: "Zoznam praxí, ktoré čakajú na potvrdenie alebo zamietnutie.",
      lang: "sk",
    },
    {
      name: "List of internships waiting for approval or rejection.",
      lang: "en",
    },
  ],
  columns: [
    {
      columnName: [
        {
          name: "ID praxe",
          lang: "sk",
        },
        {
          name: "Internship ID",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Študent (ID)",
          lang: "sk",
        },
        {
          name: "Student (ID)",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Rok",
          lang: "sk",
        },
        {
          name: "Year",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Semester",
          lang: "sk",
        },
        {
          name: "Semester",
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
          name: "From",
          lang: "en",
        },
      ],
    },
    {
      columnName: [
        {
          name: "Do",
          lang: "sk",
        },
        {
          name: "To",
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
          name: "Actions",
          lang: "en",
        },
      ],
    },
  ],
};

export default tableConfig;
