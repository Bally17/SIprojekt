"use client";

import { Company } from "@shared-types/company";
import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { searchCompanies } from "src/api/search-api";

type CompanySearchKey = readonly ["company-search", string];

type CompanySearchOptions = Omit<
  UseQueryOptions<Company[], unknown, Company[], CompanySearchKey>,
  "queryKey" | "queryFn" | "enabled"
> & {
  enabled?: boolean;
};

export function useCompanySearchQuery(
  query: string,
  options?: CompanySearchOptions,
): UseQueryResult<Company[], unknown> {
  const enabledBase = query.trim().length >= 2;
  const enabled = enabledBase && (options?.enabled ?? true);

  return useQuery<Company[], unknown, Company[], CompanySearchKey>({
    queryKey: ["company-search", query],
    enabled,
    queryFn: async () => {
      const res = await searchCompanies(query);
      return Array.isArray(res) ? res : (res.results ?? []);
    },
    ...options,
  });
}
