import { api } from "@lib/ApiProvider";
import type { StudentProfile } from "@type/backend/StudentProfile";
import type { Company } from "@type/backend/Company";

/* STUDENTS */
export function searchStudents(q: string) {
  const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<StudentProfile[] | { results?: StudentProfile[] }>(`/users/students/search/${qs}`);
}

/* COMPANIES */
export function searchCompaniesAll(q: string) {
  const qs = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
  return api.get<Company[] | { results?: Company[] }>(`/companies/search/${qs}`);
}
