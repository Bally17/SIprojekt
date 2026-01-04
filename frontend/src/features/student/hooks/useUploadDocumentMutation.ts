import { useMutation } from "@tanstack/react-query";
import { uploadDocumentFile } from "../api";

export function useUploadDocumentMutation() {
  return useMutation<unknown, any, { docId: number; file: File }>({
    mutationFn: ({ docId, file }) => uploadDocumentFile(docId, file),
  });
}
