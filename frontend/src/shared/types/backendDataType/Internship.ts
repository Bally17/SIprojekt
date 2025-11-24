import { Semester, Stav } from "@type/props/common/StateInternship";
import InternshipDocument from "./InternshipDocument";

export interface Internship {
  id: number;
  documents?: InternshipDocument[];
  student_full_name?: string | null;
  student_email?: string | null;
  company_name?: string | null;
  study_program?: string | null;
  rok: number;
  semester: Semester;
  datum_zaciatku: string;
  datum_konca: string;
  stav?: Stav;
  vytvorene_at?: string;
  zmenene_at?: string;
  student: number;
  firma: number;
  garant?: number | null;
}
