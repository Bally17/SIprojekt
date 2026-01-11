"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "chunk-reload-once";

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof (err as any).message === "string"
          ? (err as any).message
          : "";

  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk")
  );
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

export function ChunkLoadRecovery() {
  useEffect(() => {
    const maybeReload = (err: unknown) => {
      if (!isChunkLoadError(err)) return;
      if (safeSessionStorageGet(RELOAD_GUARD_KEY) === "1") return;
      safeSessionStorageSet(RELOAD_GUARD_KEY, "1");
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => maybeReload(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => maybeReload(event.reason);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
