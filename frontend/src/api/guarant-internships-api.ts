import { api } from "@lib/ApiProvider";
import type { Internship } from "@type/backend/Internship";
import type { GarantInternshipUpdate } from "@type/backend/GarantInternshipUpdate";

/* ----------------------------------------
 * GET LIST OF INTERNSHIPS FOR GARANT
 * ---------------------------------------- */

export type GarantInternshipsResponse =
  | Internship[]
  | { results?: Internship[]; internships?: Internship[] };

export function getGarantInternships(params: Record<string, string>) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== ""),
  ).toString();

  const url = qs ? `/internships/garant/internships/?${qs}` : `/internships/garant/internships/`;

  return api.get<GarantInternshipsResponse>(url);
}

/* ----------------------------------------
 * UPDATE ONE INTERNSHIP (PATCH)
 * ---------------------------------------- */

export function updateGarantInternship(id: number, payload: GarantInternshipUpdate) {
  return api.patch(`/internships/garant/internships/${id}/`, payload);
}
