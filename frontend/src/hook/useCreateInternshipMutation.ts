import { CreateInternshipPayload } from "@shared-types/internship";
import { useMutation } from "@tanstack/react-query";
import { createInternship } from "src/api/internships-api";

export function useCreateInternshipMutation() {
  return useMutation({
    mutationFn: (payload: CreateInternshipPayload) => createInternship(payload),
  });
}
