import { useMutation } from "@tanstack/react-query";
import { createInternship, type CreateInternshipPayload } from "src/api/internships-api";

export function useCreateInternshipMutation() {
  return useMutation({
    mutationFn: (payload: CreateInternshipPayload) => createInternship(payload),
  });
}
