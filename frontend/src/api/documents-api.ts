import { api } from "@lib/ApiProvider";

export async function uploadDocumentFile(docId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(`/documents/${docId}/upload/`, formData, {
    headers: {},
  });
}
