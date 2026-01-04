import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";
import { CompanySearchResponse } from "@shared-types/company";

/* COMPANIES */
export function searchCompanies(q: string) {
  const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<CompanySearchResponse>(ENDPOINTS.SEARCH_COMPANIES(qs));
}
