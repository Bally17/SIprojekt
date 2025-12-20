// src/hook/useGarantInternshipsQuery.ts
"use client";

import { Internship } from "@shared-types/internship";
import { useQuery } from "@tanstack/react-query";
import { getGarantInternships } from "src/api/guarant-internships-api";

export function useGarantInternshipsQuery(filters: Record<string, string>) {
  return useQuery<Internship[]>({
    queryKey: ["garant-internships", filters],
    queryFn: async () => {
      const res = await getGarantInternships(filters);

      if (Array.isArray(res)) return res;
      if (Array.isArray(res.results)) return res.results;
      if (Array.isArray(res.internships)) return res.internships;

      return [];
    },
  });
}
