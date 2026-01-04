import { useMutation } from "@tanstack/react-query";
import { approveCompanyDocument } from "../api";

export function useApproveCompanyDocumentMutation() {
  return useMutation({
    mutationFn: (docId: number) => approveCompanyDocument(docId),
  });
}
