export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const AUTH = "auth";
const LOGIN = "login";
const PASS = "password";
const REGISTER = "register";

export const ENDPOINTS = {
  ACTIVATE_ACCOUNT: (token: string) => `/${AUTH}/activate/${token}`,
  LOGIN_STUDENT: `/${AUTH}/${LOGIN}/`,
  LOGIN_COMPANY: `/${AUTH}/${LOGIN}/company/`,
  LOGIN_GARANT: `/${AUTH}/${LOGIN}/garant/`,
  GET_PROFILE: `/${AUTH}/profile`,
  LOGOUT: `/${AUTH}/logout/`,
  PASSWORD_RESET: `/${AUTH}/${PASS}/reset/`,
  PASSWORD_RESET_VERIFY: `/${AUTH}/${PASS}/reset/verify/`,
  PASSWORD_RESET_CONFIRM: `/${AUTH}/${PASS}/reset/confirm/`,
  PASSWORD_CHANGE: `/${AUTH}/${PASS}/change/`,
  REGISTER_COMPANY: `/${AUTH}/${REGISTER}/company/`,
  REGISTER_STUDENT: `/${AUTH}/${REGISTER}/student/`,
  INTERNSHIPS_PENDING: `/internships/company/me/internships/pending/`,
  INTERNSHIPS_CONFIRM: (token: number) => `/internships/company/confirm/${token}/`,
  INTERNSHIPS_REJECT: (token: number) => `/internships/company/reject/${token}/`,
  INTERNSHIPS: (token: string = "") => `/internships/company/me/internships/${token}`,
  DOCUMENTS: (token: number) => `/documents/${token}/upload/`,
  INTERNSHIPS_GARANT: (token: string = "") => `/internships/garant/internships/${token}`,
  INTERNSHIPS_GARAN_EXPORT: `${BASE_URL}/internships/garant/internships/export/`,
  INTERNSHIPS_GARANT_UPDATE: (token: number) => `/internships/garant/internships/${token}/`,
  INTERNSHIPS_STUDENT: `/internships/me/internships/`,
  INTERNSHIPS_CREATE: `/internships/create/`,
  SEARCH_COMPANIES: (token: string) => `/companies/search/${token}`,
  SEARCH_STUDENTS: (token: string) => `/users/students/search/${token}`,
  OAUTH_CLIENT: `/${AUTH}/oauth/clients/`,
  OAUTH_CLIENT_DELETE: (token: string) => `/${AUTH}/oauth/clients/${token}/`,
} as const;
