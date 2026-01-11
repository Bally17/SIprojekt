"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@constants";
import { setAuthTokens } from "@lib/ApiProvider";
import { useLocalization } from "@i18n/client";

type OAuthStatus = "pending" | "success" | "error" | "existing";

const STORAGE_KEYS = {
  githubState: "github_oauth_state",
  githubFlow: "github_oauth_flow",
} as const;

const REDIRECT_AFTER_SUCCESS = "/auth/login";
const AUTO_REDIRECT_MS = 0;

export default function GithubCallbackPage() {
  const router = useRouter();
  const { msgs } = useLocalization();
  const [status, setStatus] = useState<OAuthStatus>("pending");
  const [message, setMessage] = useState(msgs.auth.githubProcessing);
  const [redirectUrl, setRedirectUrl] = useState<string>(REDIRECT_AFTER_SUCCESS);
  const [registerUrl, setRegisterUrl] = useState<string>("/auth/register/company");
  const hasExchanged = useRef(false);

  const {
    githubLoginSuccessMessage,
    githubContinue,
    githubProcessing,
    githubLoginFailed,
    githubInvalidState,
    githubEmailExistsMessage,
    githubBackToRegister,
    githubContinueToLogin,
  } = msgs.auth;

  useEffect(() => {
    if (hasExchanged.current) {
      return;
    }
    hasExchanged.current = true;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashStatus = hashParams.get("status");
    if (hashStatus) {
      const access = hashParams.get("access");
      const refresh = hashParams.get("refresh");
      const errorMessage = hashParams.get("message");

      if (access && refresh) {
        setAuthTokens({ access, refresh });
      }

      if (hashStatus === "existing") {
        setStatus("existing");
        setMessage(githubEmailExistsMessage);
        setRedirectUrl("/auth/login");
        setRegisterUrl("/auth/register/company");
      } else if (hashStatus === "success") {
        setStatus("success");
        setMessage(githubLoginSuccessMessage);
        setRedirectUrl(REDIRECT_AFTER_SUCCESS);
      } else {
        setStatus("error");
        setMessage(errorMessage || githubLoginFailed);
      }

      window.history.replaceState({}, document.title, "/auth/github");
      sessionStorage.removeItem(STORAGE_KEYS.githubState);
      sessionStorage.removeItem(STORAGE_KEYS.githubFlow);
      return;
    }
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.githubState);
    const flow = sessionStorage.getItem(STORAGE_KEYS.githubFlow);
    const exchangeKey = code ? `github_oauth_exchanged:${code}` : null;
    if (exchangeKey && sessionStorage.getItem(exchangeKey) === "true") {
      return;
    }

    window.history.replaceState({}, document.title, "/auth/github");

    const finishError = (msg: string) => {
      setStatus("error");
      setMessage(msg);
    };

    const exchange = async () => {
      try {
        setMessage(githubProcessing);

        if (error || !code || !returnedState) {
          finishError(githubLoginFailed);
          return;
        }

        if (!expectedState || returnedState !== expectedState) {
          finishError(githubInvalidState);
          return;
        }

        if (exchangeKey) {
          sessionStorage.setItem(exchangeKey, "true");
        }

        const endpoint =
          flow === "company"
            ? `${BASE_URL}/auth/register/company/github/`
            : `${BASE_URL}/auth/github/`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: `${window.location.origin}/auth/github`,
          }),
        });

        const raw = await res.text();
        if (!res.ok) {
          let backendMessage = "";
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            backendMessage = parsed?.error ?? parsed?.message ?? "";
          } catch {
            backendMessage = "";
          }
          finishError(backendMessage || githubLoginFailed);
          return;
        }

        const data = JSON.parse(raw);
        if (data?.created === false) {
          setStatus("existing");
          setMessage(githubEmailExistsMessage);
          setRedirectUrl("/auth/login");
          setRegisterUrl(flow === "company" ? "/auth/register/company" : "/auth/register");
          return;
        }

        if (data?.tokens?.access) {
          setAuthTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
        }

        setStatus("success");
        setMessage(githubLoginSuccessMessage);
        setRedirectUrl(REDIRECT_AFTER_SUCCESS);

        if (AUTO_REDIRECT_MS > 0) {
          window.setTimeout(() => router.replace(REDIRECT_AFTER_SUCCESS), AUTO_REDIRECT_MS);
        }
      } catch {
        finishError(githubLoginFailed);
      } finally {
        sessionStorage.removeItem(STORAGE_KEYS.githubState);
        sessionStorage.removeItem(STORAGE_KEYS.githubFlow);
      }
    };

    void exchange();
  }, [
    router,
    githubLoginSuccessMessage,
    githubContinue,
    githubProcessing,
    githubLoginFailed,
    githubInvalidState,
    githubEmailExistsMessage,
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
              {githubContinue}
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
              {githubContinueToLogin}
            </button>
            <button
              type="button"
              onClick={() => router.replace(registerUrl)}
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-gray-50"
            >
              {githubBackToRegister}
            </button>
          </div>
        ) : null}

        {status === "error" ? (
          <a
            href="/auth/login"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            {githubContinueToLogin}
          </a>
        ) : null}
      </div>
    </main>
  );
}
