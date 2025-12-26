import { useMutation } from "@tanstack/react-query";
import { rejectCompanyDocument } from "src/api/documents-api";

export function useRejectCompanyDocumentMutation() {
  return useMutation({
    mutationFn: ({ docId, reason }: { docId: number; reason: string }) =>
      rejectCompanyDocument(docId, reason),
  });
}
