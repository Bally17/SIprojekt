import { useMutation } from "@tanstack/react-query";
import { uploadDocumentWithUrlFile } from "src/api/documents-api";

export function useUploadDocumentFileMutation() {
  return useMutation({
    mutationFn: ({ docId, file }: { docId: number; file: File }) =>
      uploadDocumentWithUrlFile(docId, file),
  });
}
