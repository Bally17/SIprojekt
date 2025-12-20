import { useQuery } from "@tanstack/react-query";
import { getStudentInternships } from "src/api/internships-api";
import type { InternshipWithRelations, StudentInternshipsResponse } from "src/api/internships-api";

function normalize(res: StudentInternshipsResponse): InternshipWithRelations[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.results?.internships)) return res.results.internships;
  if (Array.isArray(res.internships)) return res.internships;
  return [];
}

export function useStudentInternshipsQuery() {
  return useQuery({
    queryKey: ["student-internships"],
    queryFn: async () => {
      const res = await getStudentInternships();
      return normalize(res);
    },
  });
}
