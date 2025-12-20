import { useQuery } from "@tanstack/react-query";
import {
  getCompanyInternships,
  type CompanyInternshipsApiResponse,
  type CompanyInternshipsResponse,
  type PaginatedCompanyInternshipsResponse,
} from "src/api/company-internships-api";

export function useCompanyInternshipsQuery(filters: Record<string, string>) {
  return useQuery<CompanyInternshipsApiResponse>({
    queryKey: ["company-internships", filters],
    queryFn: () => getCompanyInternships(filters),
    staleTime: 0,
  });
}

export function extractInternships(
  data: CompanyInternshipsApiResponse | undefined,
): CompanyInternshipsResponse["internships"] {
  if (!data) return [];

  // bezpečné overenie objektu
  if (typeof data === "object" && data !== null && Object.hasOwn(data, "results")) {
    const d = data as PaginatedCompanyInternshipsResponse;
    return d.results?.internships ?? [];
  }

  return (data as CompanyInternshipsResponse).internships ?? [];
}
