import type { StudentProfile } from "@type/backend/StudentProfile";
import type { Company } from "@type/backend/Company";

export function normalizeSearchResponse<T>(res: T[] | { results?: T[] }): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results)) return res.results;
  return [];
}

export function normalizeStudentSearchResponse(
  res: StudentProfile[] | { results?: StudentProfile[] },
): StudentProfile[] {
  return normalizeSearchResponse<StudentProfile>(res);
}

export function normalizeCompanySearchResponse(
  res: Company[] | { results?: Company[] },
): Company[] {
  return normalizeSearchResponse<Company>(res);
}
