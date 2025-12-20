import { api } from "@lib/ApiProvider";
import { CompanySearchResponse } from "@shared-types/company";
import { StudentSearchResponse } from "@shared-types/student";
import { ENDPOINTS } from "src/constants/Endpoints";

/* STUDENTS */
export function searchStudents(q: string) {
  const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<StudentSearchResponse>(ENDPOINTS.SEARCH_STUDENTS(qs));
}

/* COMPANIES */
export function searchCompanies(q: string) {
  const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<CompanySearchResponse>(ENDPOINTS.SEARCH_COMPANIES(qs));
}
