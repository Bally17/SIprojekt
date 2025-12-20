import { api } from "@lib/ApiProvider";
import { OAuthClient, CreateOAuthClientPayload } from "@shared-types/oauth";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function getOAuthClients() {
  return api.get<OAuthClient[]>(ENDPOINTS.OAUTH_CLIENT);
}

export async function createOAuthClient(payload: CreateOAuthClientPayload) {
  return api.post<OAuthClient>(ENDPOINTS.OAUTH_CLIENT, payload);
}

export async function deleteOAuthClient(id: string): Promise<void> {
  await api.delete(ENDPOINTS.OAUTH_CLIENT_DELETE(id));
}
