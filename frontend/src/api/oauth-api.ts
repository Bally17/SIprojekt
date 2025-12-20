import { api } from "@lib/ApiProvider";

export type OAuthClient = {
  client_id: string;
  name: string;
  redirect_uris: string[];
  scope?: string | null;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  service_user_id?: number | null;
  public_key?: string | null;
};

export type CreateOAuthClientPayload = {
  name: string;
  redirect_uris: string[];
  scope?: string;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  public_key?: string;
  service_user_id?: number;
};

export async function getOAuthClients() {
  return api.get<OAuthClient[]>("/auth/oauth/clients/");
}

export async function createOAuthClient(payload: CreateOAuthClientPayload) {
  return api.post<OAuthClient>("/auth/oauth/clients/", payload);
}

export async function deleteOAuthClient(id: string): Promise<void> {
  await api.delete(`/auth/oauth/clients/${id}/`);
}
