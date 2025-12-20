"use client";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { searchStudents } from "src/api/student-api";
import type { StudentProfile } from "@type/backend/StudentProfile";

type StudentSearchKey = readonly ["student-search", string];

type StudentSearchOptions = Omit<
  UseQueryOptions<StudentProfile[], unknown, StudentProfile[], StudentSearchKey>,
  "queryKey" | "queryFn" | "enabled"
> & {
  enabled?: boolean;
};

export function useStudentSearchQuery(
  query: string,
  options?: StudentSearchOptions,
): UseQueryResult<StudentProfile[], unknown> {
  const enabledBase = query.trim().length >= 2;
  const enabled = enabledBase && (options?.enabled ?? true);

  return useQuery<StudentProfile[], unknown, StudentProfile[], StudentSearchKey>({
    queryKey: ["student-search", query],
    enabled,
    queryFn: async () => {
      const res = await searchStudents(query);
      return Array.isArray(res) ? res : (res.results ?? []);
    },
    ...options,
  });
}
