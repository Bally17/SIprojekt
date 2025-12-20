import { api } from "@lib/ApiProvider";

export type ActivateResponse = {
  message?: string;
  [key: string]: unknown;
};

export function activateAccount(token: string) {
  return api.get<ActivateResponse>(`/auth/activate/${token}/`);
}
