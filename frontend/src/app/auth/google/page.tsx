"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@constants";
import { setAuthTokens } from "@lib/ApiProvider";

type OAuthStatus = "pending" | "success" | "error";

const STORAGE_KEYS = {
  googleState: "google_oauth_state",
  googleVerifier: "google_code_verifier",
} as const;

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<OAuthStatus>("pending");
  const [message, setMessage] = useState("Dokončujem prihlásenie cez Google...");

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.googleState);
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.googleVerifier);

    // vyčisti URL (aby si nemal code/state v histórii)
    window.history.replaceState({}, document.title, "/auth/google");

    const finishError = (msg: string) => {
      setStatus("error");
      setMessage(msg);
    };

    const exchange = async () => {
      try {
        if (error || !code || !returnedState) {
          finishError("Google prihlásenie zlyhalo. Skúste to znova.");
          return;
        }

        if (!expectedState || returnedState !== expectedState || !codeVerifier) {
          finishError("Neplatný OAuth stav (state). Skúste to znova.");
          return;
        }

        const res = await fetch(`${BASE_URL}/auth/google/`, {
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
          // ukáž reálny backend error (pomôže debugovať)
          finishError(raw || `Google login failed (${res.status})`);
          return;
        }

        const data = JSON.parse(raw);
        if (data?.tokens?.access) {
          setAuthTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
        }

        setStatus("success");
        setMessage("Úspešne prihlásený, presmerovávam...");
        router.replace("/");
      } catch {
        finishError("Google prihlásenie zlyhalo. Skúste to znova.");
      } finally {
        sessionStorage.removeItem(STORAGE_KEYS.googleState);
        sessionStorage.removeItem(STORAGE_KEYS.googleVerifier);
      }
    };

    void exchange();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-lg bg-white p-6 text-center shadow">
        <p className="text-lg font-semibold text-ink-900">{message}</p>
        {status === "error" ? (
          <a
            href="/auth/login"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Späť na prihlásenie
          </a>
        ) : null}
      </div>
    </main>
  );
}
