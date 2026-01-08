import { ENDPOINTS } from "@constants";
import { api } from "@lib/ApiProvider";
import {
  MissingProfileFieldsResponse,
  CompanyProfileCompletePayload,
  CompanyProfileCompleteResponse,
} from "@shared-types/auth";

export function getProfileMissingFields() {
  return api.get<MissingProfileFieldsResponse>(ENDPOINTS.PROFILE_MISSING_FIELDS);
}

export function completeCompanyProfile(payload: CompanyProfileCompletePayload) {
  return api.post<CompanyProfileCompleteResponse>(ENDPOINTS.COMPANY_PROFILE_COMPLETE, payload);
}
