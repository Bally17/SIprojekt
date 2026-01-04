import type { Semester, Stav } from "./core/internshipState";
import type { IntegerOrNull, Nullable, StringOrNull } from "./core/primitives";
import type { Company } from "./company";

export interface InternshipDocument {
  id: number;
  typ_dokumentu: string;
  subor_url: string;
  stav_dokumentu?: string;
  skontrolovane_at?: StringOrNull;
  vytvorene_at?: string;
  zmenene_at?: string;
  prax: number;
  nahrane_pouzivatel: number;
  skontroloval?: IntegerOrNull;
}

export interface Internship {
  id: number;
  documents?: InternshipDocument[];
  student_full_name?: StringOrNull;
  student_email?: StringOrNull;
  company_name?: StringOrNull;
  study_program?: StringOrNull;
  rok: number;
  semester: Semester;
  datum_zaciatku: string;
  datum_konca: string;
  stav?: Stav;
  vytvorene_at?: string;
  zmenene_at?: string;
  student: number;
  firma: Company;
  garant?: IntegerOrNull;
}

export interface InternshipHistory {
  id: number;
  stary_stav?: Nullable<Stav>;
  novy_stav: Stav;
  poznamka?: StringOrNull;
  zmena_at?: string;
  prax: number;
  zmenil?: IntegerOrNull;
}

export interface GarantInternshipUpdate {
  firma_id: string;
  student_id: string;
  datum_zaciatku: string;
  datum_konca: string;
  stav: Stav;
  status_note: string;
}

export type InternshipWithRelations = Internship & {
  firma?: Company | null;
  documents?: InternshipDocument[];
};

export type StudentInternshipsResponse =
  | InternshipWithRelations[]
  | {
      internships?: InternshipWithRelations[];
      results?: { internships?: InternshipWithRelations[] };
    };

export type CreateInternshipPayload = {
  rok: number;
  semester: string;
  datum_zaciatku?: string;
  datum_konca?: string;
  firma_id: number;
};
