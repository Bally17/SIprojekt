"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const RELOAD_GUARD_KEY = "chunk-error-reload-once";
const ERROR_TITLE = "Something went wrong."; // i18n-ignore
const ERROR_RETRY = "Try again"; // i18n-ignore

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  let message = "";

  if (typeof err === "string") {
    message = err;
  } else if (err instanceof Error) {
    message = err.message;
  } else if (typeof (err as any)?.message === "string") {
    message = (err as any).message;
  }

  return message.includes("ChunkLoadError") || message.includes("Loading chunk");
}

function safeSessionStorageGet(key: string): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string) {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private mode, blocked storage, etc.).
  }
}

export default function GlobalError({ error, reset }: Readonly<Props>) {
  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    if (safeSessionStorageGet(RELOAD_GUARD_KEY) === "1") return;
    safeSessionStorageSet(RELOAD_GUARD_KEY, "1");
    globalThis.location.reload();
  }, [error]);

  return (
    <html lang="sk">
      <body>
        <h2>{ERROR_TITLE}</h2>
        <button type="button" onClick={() => reset()}>
          {ERROR_RETRY}
        </button>
      </body>
    </html>
  );
}
