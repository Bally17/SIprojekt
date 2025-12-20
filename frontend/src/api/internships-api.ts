import { api } from "@lib/ApiProvider";
import type { Internship } from "@type/backend/Internship";
import type { Company } from "@type/backend/Company";
import type InternshipDocument from "@type/backend/InternshipDocument";

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

export function getStudentInternships() {
  return api.get<StudentInternshipsResponse>("/internships/me/internships/");
}

export type CreateInternshipPayload = {
  rok: number;
  semester: string;
  datum_zaciatku?: string;
  datum_konca?: string;
  firma_id: number;
};

export function createInternship(payload: CreateInternshipPayload) {
  return api.post("/internships/create/", payload);
}

export type CompanySearchResponse = Company[] | { results?: Company[] };

export function searchCompanies(q: string) {
  return api.get<CompanySearchResponse>(`/companies/search/?q=${encodeURIComponent(q)}`);
}
