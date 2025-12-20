import { api } from "@lib/ApiProvider";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function uploadDocumentFile(docId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(ENDPOINTS.DOCUMENTS(docId), formData, {
    headers: {},
  });
}
