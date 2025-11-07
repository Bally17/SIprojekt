import type { InternshipDocument } from "./components/InternshipDocument";
import { Semester, Stav } from "./components/StateInternship";

export interface Internship {
  id: number;
  rok: number;
  semester: Semester;
  datum_zaciatku: string;
  datum_konca: string;
  stav: Stav;
  student: number;
  firma?: number;
  garant?: number | null;
  vytvorene_at?: string;
  zmenene_at?: string;
  documents?: InternshipDocument[];
}
