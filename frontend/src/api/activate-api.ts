import { api } from "@lib/ApiProvider";
import { ENDPOINTS } from "src/constants/Endpoints";

export type ActivateResponse = {
  message?: string;
  [key: string]: unknown;
};

export function activateAccount(token: string) {
  return api.get<ActivateResponse>(ENDPOINTS.ACTIVATE_ACCOUNT(token));
}
