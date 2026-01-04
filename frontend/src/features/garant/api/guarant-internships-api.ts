import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";

export type GarantInternshipsResponse =
  | Internship[]
  | { results?: Internship[]; internships?: Internship[] };

export function getGarantInternships(params: Record<string, string>) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value !== ""),
  ).toString();

  const url = ENDPOINTS.INTERNSHIPS_GARANT(qs ? `?${qs}` : "");

  return api.get<GarantInternshipsResponse>(url);
}

export function updateGarantInternship(id: number, payload: GarantInternshipUpdate) {
  return api.patch(ENDPOINTS.INTERNSHIPS_GARANT_UPDATE(id), payload);
}
