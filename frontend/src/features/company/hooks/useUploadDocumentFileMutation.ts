import { useMutation } from "@tanstack/react-query";
import { uploadDocumentWithUrlFile } from "../api";

export function useUploadDocumentFileMutation() {
  return useMutation({
    mutationFn: ({ docId, file }: { docId: number; file: File }) =>
      uploadDocumentWithUrlFile(docId, file),
  });
}
