import { Semester, Stav } from "@/shared/types/internship/components/StateInternship";

export type TableFilters = {
  rok?: number | string;
  semester: Semester | "";
  stav: Stav | "";
};
