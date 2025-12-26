import { useMutation } from "@tanstack/react-query";
import { approveCompanyDocument } from "src/api/documents-api";

export function useApproveCompanyDocumentMutation() {
  return useMutation({
    mutationFn: (docId: number) => approveCompanyDocument(docId),
  });
}
