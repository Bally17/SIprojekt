import { Semester, Stav } from "@type/props/common/StateInternship";

export type TableFilters = {
  rok?: number | string;
  semester: Semester | "";
  stav: Stav | "";
};
