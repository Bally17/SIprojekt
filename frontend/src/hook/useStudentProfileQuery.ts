// src/hook/useStudentProfileQuery.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { StudentProfile } from "@type/backend/StudentProfile";
import { getStudentProfile } from "src/api/student-api";

export function useStudentProfileQuery() {
  return useQuery<StudentProfile>({
    queryKey: ["student-profile"],
    queryFn: getStudentProfile,
  });
}
