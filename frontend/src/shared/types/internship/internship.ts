import type { InternshipDocument } from "./components/InternshipDocument";

export interface Internship {
  id: number;
  rok: number;
  semester: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: string;
  student: number;
  documents?: InternshipDocument[];
}
