"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL, ENDPOINTS } from "@constants";
import { setAuthTokens } from "@lib/ApiProvider";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";

type OAuthStatus = "pending" | "success" | "error" | "existing";

const STORAGE_KEYS = {
  googleState: "google_oauth_state",
  googleVerifier: "google_code_verifier",
  googleFlow: "google_oauth_flow",
} as const;

const REDIRECT_AFTER_SUCCESS = "/auth/login";
const AUTO_REDIRECT_MS = 0; // 0 = nikdy automaticky, len tlacidlo

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { msgs } = useLocalization();
  const { success: notifySuccess, info: notifyInfo } = useSystemNotifications();
  const [status, setStatus] = useState<OAuthStatus>("pending");
  const [message, setMessage] = useState(msgs.auth.googleProcessing);
  const [redirectUrl, setRedirectUrl] = useState<string>(REDIRECT_AFTER_SUCCESS);
  const [registerUrl, setRegisterUrl] = useState<string>("/auth/register/company");

  const {
    googleRegisterSuccessTitle,
    googleRegisterSuccessDescription,
    googleProfileCompleteTitle,
    googleProfileCompleteDescription,
    googleLoginSuccessMessage,
    googleContinue,
    goToLogin,
    googleProcessing,
    googleLoginFailed,
    googleInvalidState,
    googleEmailExistsMessage,
    googleBackToRegister,
    googleContinueToLogin,
  } = msgs.auth;

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.googleState);
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.googleVerifier);
    const flow = sessionStorage.getItem(STORAGE_KEYS.googleFlow);

    window.history.replaceState({}, document.title, "/auth/google");

    const finishError = (msg: string) => {
      setStatus("error");
      setMessage(msg);
    };

    const exchange = async () => {
      try {
        setMessage(googleProcessing);

        if (error || !code || !returnedState) {
          finishError(googleLoginFailed);
          return;
        }

        if (!expectedState || returnedState !== expectedState || !codeVerifier) {
          finishError(googleInvalidState);
          return;
        }

        const endpoint =
          flow === "company"
            ? `${BASE_URL}${ENDPOINTS.GOOGLE_COMPANY_REGISTER}`
            : `${BASE_URL}${ENDPOINTS.GOOGLE_LOGIN}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${window.location.origin}/auth/google`,
          }),
        });

        const raw = await res.text();
        if (!res.ok) {
          let backendMessage = "";
          let errorCode = "";
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            backendMessage = parsed?.error ?? parsed?.message ?? "";
            errorCode = parsed?.code ?? parsed?.error_code ?? parsed?.errorCode ?? "";
          } catch {
            backendMessage = "";
          }
          const normalized = `${errorCode} ${backendMessage}`.toLowerCase();
          const emailExistsSignals = [
            "email_already_registered",
            "email_already_exists",
            "email_exists",
            "email_in_use",
          ];
          const looksLikeEmailExists =
            emailExistsSignals.some((signal) => normalized.includes(signal)) ||
            (normalized.includes("email") &&
              (normalized.includes("exist") ||
                normalized.includes("registered") ||
                normalized.includes("taken")));

          if (looksLikeEmailExists) {
            setStatus("existing");
            setMessage(googleEmailExistsMessage);
            setRedirectUrl("/auth/login");
            setRegisterUrl(flow === "company" ? "/auth/register/company" : "/auth/register");
            return;
          }

          finishError(backendMessage || googleLoginFailed);
          return;
        }

        const data = JSON.parse(raw);
        if (data?.created === false) {
          setStatus("existing");
          setMessage(googleEmailExistsMessage);
          setRedirectUrl("/auth/login");
          setRegisterUrl(flow === "company" ? "/auth/register/company" : "/auth/register");
          return;
        }

        if (data?.tokens?.access) {
          setAuthTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
        }

        setStatus("success");
        setMessage(googleLoginSuccessMessage);
        setRedirectUrl(REDIRECT_AFTER_SUCCESS);

        notifySuccess({
          title: googleRegisterSuccessTitle,
          description: googleRegisterSuccessDescription,
        });
        notifyInfo({
          title: googleProfileCompleteTitle,
          description: googleProfileCompleteDescription,
        });

        if (AUTO_REDIRECT_MS > 0) {
          window.setTimeout(() => router.replace(REDIRECT_AFTER_SUCCESS), AUTO_REDIRECT_MS);
        }
      } catch {
        finishError(googleLoginFailed);
      } finally {
        sessionStorage.removeItem(STORAGE_KEYS.googleState);
        sessionStorage.removeItem(STORAGE_KEYS.googleVerifier);
        sessionStorage.removeItem(STORAGE_KEYS.googleFlow);
      }
    };

    void exchange();
  }, [
    router,
    notifySuccess,
    notifyInfo,
    googleRegisterSuccessTitle,
    googleRegisterSuccessDescription,
    googleProfileCompleteTitle,
    googleProfileCompleteDescription,
    googleLoginSuccessMessage,
    googleContinue,
    goToLogin,
    googleProcessing,
    googleLoginFailed,
    googleInvalidState,
    googleEmailExistsMessage,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
        <p className="text-lg font-semibold text-ink-900">{message}</p>

        {status === "success" ? (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => router.replace(redirectUrl)}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {googleContinue}
            </button>
          </div>
        ) : null}

        {status === "existing" ? (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => router.replace(redirectUrl)}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {googleContinueToLogin}
            </button>
            <button
              type="button"
              onClick={() => router.replace(registerUrl)}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              {googleBackToRegister}
            </button>
          </div>
        ) : null}

        {status === "error" ? (
          <a
            href="/auth/login"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {goToLogin}
          </a>
        ) : null}
      </div>
    </main>
  );
}
