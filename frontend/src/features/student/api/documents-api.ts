// \src\feature\student\api\documents-api.ts
import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";

export async function uploadDocumentFile(docId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(ENDPOINTS.DOCUMENTS(docId), formData, {
    headers: {},
  });
}
