import { Company } from "@shared-types/company";
import { useMutation } from "@tanstack/react-query";
import { searchCompanies } from "../api";

export function useCompanySearchMutation() {
  return useMutation<Company[], unknown, string>({
    mutationFn: async (query: string) => {
      const res = await searchCompanies(query);
      return Array.isArray(res) ? res : (res.results ?? []);
    },
  });
}
