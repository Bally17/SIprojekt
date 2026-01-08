// frontend\src\features\auth\_components\GoogleGithubActionBtns.tsx
"use client";

import Image from "next/image";
import { Button } from "@components/button";
import { BASE_URL } from "@constants";
import { useLocalization } from "@i18n/client";

const STORAGE_KEYS = {
  googleState: "google_oauth_state",
  googleVerifier: "google_code_verifier",
  googleFlow: "google_oauth_flow",
} as const;

function base64UrlEncode(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data);
}

function randomString(byteLen = 64) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

const GoogleGithubActionBtns = () => {
  const { msgs } = useLocalization();

  const handleGoogleLogin = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const redirectUri = `${window.location.origin}/auth/google`;

    const state = randomString(32);
    const codeVerifier = randomString(64);
    const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

    sessionStorage.setItem(STORAGE_KEYS.googleState, state);
    sessionStorage.setItem(STORAGE_KEYS.googleVerifier, codeVerifier);
    sessionStorage.setItem(STORAGE_KEYS.googleFlow, "company");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "consent",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${BASE_URL}/auth/github/?next=${encodeURIComponent(
      window.location.origin + "/auth/register/company",
    )}`;
  };
  return (
    <div className="pt-2 space-y-2 text-center">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <p className="text-xs font-medium text-gray-500">{msgs.auth.orWith}</p>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <Button
        type="button"
        onClick={handleGoogleLogin}
        variant="ghost"
        className="flex w-full items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
      >
        <Image
          unoptimized
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="h-5 w-5"
          width={20}
          height={20}
        />
        {msgs.auth.google}
      </Button>

      <Button
        type="button"
        onClick={handleGithubLogin}
        variant="ghost"
        className="flex w-full items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
      >
        <Image
          unoptimized
          src="https://www.svgrepo.com/show/512317/github-142.svg"
          alt="GitHub"
          className="h-5 w-5"
          width={20}
          height={20}
        />
        {msgs.auth.github}
      </Button>
    </div>
  );
};

export default GoogleGithubActionBtns;
