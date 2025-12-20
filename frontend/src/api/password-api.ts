import { api } from "@lib/ApiProvider";
import {
  ResetPasswordPayload,
  ForgotPasswordPayload,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from "@shared-types/auth";
import { ENDPOINTS } from "src/constants/Endpoints";

export async function resetPassword(payload: ResetPasswordPayload) {
  return api.post(ENDPOINTS.PASSWORD_RESET_CONFIRM, payload);
}

export async function requestPasswordReset(payload: ForgotPasswordPayload) {
  return api.post(ENDPOINTS.PASSWORD_RESET, payload);
}

export function changePassword(payload: ChangePasswordPayload) {
  return api.post<ChangePasswordResponse>(ENDPOINTS.PASSWORD_CHANGE, payload);
}
