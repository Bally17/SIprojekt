import { Semester, Stav } from "@type/props/internship";

export type TableFilters = {
  rok?: number | string;
  semester: Semester | "";
  stav: Stav | "";
};
