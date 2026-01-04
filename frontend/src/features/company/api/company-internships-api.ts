import { api } from "@lib/ApiProvider";
import { Internship } from "@shared-types/internship";
import { ENDPOINTS } from "src/constants/Endpoints";

export type CompanyInternshipsResponse = {
  firma: {
    id: number;
    email: string;
    meno?: string | null;
    priezvisko?: string | null;
  };
  internships: Internship[];
};

export type PaginatedCompanyInternshipsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CompanyInternshipsResponse;
};

export type CompanyInternshipsApiResponse =
  | CompanyInternshipsResponse
  | PaginatedCompanyInternshipsResponse;

export type PendingInternshipsResponse = {
  results?: {
    firma?: {
      meno?: string | null;
      priezvisko?: string | null;
      email: string;
    };
    internships?: Internship[];
  };
};

export function getCompanyInternships(params: Record<string, string>) {
  const filtered = Object.entries(params).filter(([, v]) => v !== "");
  const qs = new URLSearchParams(filtered).toString();

  const url = ENDPOINTS.INTERNSHIPS(qs ? `?${qs}` : "");

  return api.get<CompanyInternshipsApiResponse>(url);
}

export function getPendingInternships() {
  return api.get<PendingInternshipsResponse>(ENDPOINTS.INTERNSHIPS_PENDING);
}

export function confirmInternship(id: number) {
  return api.patch(ENDPOINTS.INTERNSHIPS_CONFIRM(id), {});
}

export function rejectInternship(id: number) {
  return api.patch(ENDPOINTS.INTERNSHIPS_REJECT(id), {});
}
