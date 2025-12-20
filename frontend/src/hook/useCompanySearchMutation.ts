import { useMutation } from "@tanstack/react-query";
import { searchCompanies } from "src/api/internships-api";
import type { Company } from "@type/backend/Company";

export function useCompanySearchMutation() {
  return useMutation<Company[], unknown, string>({
    mutationFn: async (query: string) => {
      const res = await searchCompanies(query);
      return Array.isArray(res) ? res : (res.results ?? []);
    },
  });
}
