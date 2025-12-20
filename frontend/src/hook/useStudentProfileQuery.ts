// src/hook/useStudentProfileQuery.ts
"use client";

import { StudentProfile } from "@shared-types/student";
import { useQuery } from "@tanstack/react-query";
import { getStudentProfile } from "src/api/student-api";

export function useStudentProfileQuery() {
  return useQuery<StudentProfile>({
    queryKey: ["student-profile"],
    queryFn: getStudentProfile,
  });
}
