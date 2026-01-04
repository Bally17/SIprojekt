import { useQuery } from "@tanstack/react-query";
import {
  CompanyInternshipsApiResponse,
  getCompanyInternships,
  CompanyInternshipsResponse,
  PaginatedCompanyInternshipsResponse,
} from "../api";

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
