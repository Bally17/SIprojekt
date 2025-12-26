// \src\api\documents-api.ts
import { api } from "@lib/ApiProvider";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function uploadDocumentFile(docId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return api.post(ENDPOINTS.DOCUMENTS(docId), formData, {
    headers: {},
  });
}

export async function uploadDocumentWithUrlFile(docId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  // axios si Content-Type pre FormData nastaví sám
  return api.post(ENDPOINTS.DOCUMENTS(docId), formData);
}

export async function approveCompanyDocument(docId: number) {
  return api.post(ENDPOINTS.DOCUMENTS_APPROVED(docId), {});
}

export async function rejectCompanyDocument(docId: number, reason: string) {
  return api.post(ENDPOINTS.DOCUMENTS_REJECTED(docId), { reason });
}
