import { useMutation } from "@tanstack/react-query";
import { rejectCompanyDocument } from "../api";

export function useRejectCompanyDocumentMutation() {
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: number; reason: string }) =>
      rejectCompanyDocument(docId, reason),
  });
}
