import type { IntegerOrNull, StringOrNull } from "./core/primitives";

export type OAuthClient = {
  client_id: string;
  name: string;
  redirect_uris: string[];
  scope?: StringOrNull;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  service_user_id?: IntegerOrNull;
  public_key?: StringOrNull;
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
