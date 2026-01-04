import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";

export type ActivateResponse = {
  message?: string;
  [key: string]: unknown;
};

export function activateAccount(token: string) {
  return api.get<ActivateResponse>(ENDPOINTS.ACTIVATE_ACCOUNT(token));
}
