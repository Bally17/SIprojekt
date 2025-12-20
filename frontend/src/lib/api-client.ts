const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Pomenovania pre storage:
const REFRESH_KEY = "refresh_token";
const ACCESS_SS_KEY = "access_token_ss";

// In-memory access token (bezpečné:
let accessTokenMemory: string | null = null;

// Načítanie access tokenu zo sessionStorage pri reloade tabu
function loadInitialTokens() {
  if (typeof window === "undefined") return;
  const access = sessionStorage.getItem(ACCESS_SS_KEY);
  if (access) accessTokenMemory = access;
}
loadInitialTokens();

export function setAuthTokens(tokens: { access: string; refresh?: string }) {
  accessTokenMemory = tokens.access;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(ACCESS_SS_KEY, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_KEY, tokens.refresh);
    }
  }
}

export function clearAuthTokens() {
  accessTokenMemory = null;

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ACCESS_SS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export const getAccessToken = () => accessTokenMemory;

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export async function request<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    // FormData si pridá vlastný boundary; Content-Type je len pre JSON
    headers.set("Content-Type", "application/json");
  }
  if (getAccessToken() && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${getAccessToken()}`);
  }

  const res = await fetch(baseURL + url, {
    ...options,
    headers,
  });

  // 401 → pokus o refresh
  if (res.status === 401) {
    const originalRequest = { url, options };

    try {
      // Refresh už prebieha – počkaj naň
      if (isRefreshing && refreshPromise) {
        const newAccess = await new Promise<string>((resolve) => subscribeTokenRefresh(resolve));

        return request<T>(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${newAccess}`,
          },
        });
      }

      // Spusti vlastný refresh
      const newAccess = await refreshToken();

      return request<T>(url, {
        ...originalRequest.options,
        headers: {
          ...(originalRequest.options.headers || {}),
          Authorization: `Bearer ${newAccess}`,
        },
      });
    } catch (err) {
      clearAuthTokens();

      // zabalíme chybu do axios-like objektu
      const error: any = err instanceof Error ? err : new Error("Unauthorized");
      error.status = 401;
      if (!error.response) {
        error.response = { data: { detail: "Unauthorized" } };
      }
      throw error;
    }
  }

  // Iné chyby (4xx/5xx)
  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = null;
    }

    const message =
      errorBody?.detail ||
      errorBody?.message ||
      errorBody?.error ||
      `Request failed with status ${res.status}`;

    const error: any = new Error(message);
    error.status = res.status;
    error.response = { data: errorBody };
    throw error;
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

type BroadcastMsg =
  | { type: "refresh-start" }
  | { type: "refresh-success"; access: string; refresh?: string }
  | { type: "logout" };

const bc = typeof window !== "undefined" ? new BroadcastChannel("auth") : null;

bc?.addEventListener("message", (ev: MessageEvent<BroadcastMsg>) => {
  const msg = ev.data;
  if (!msg) return;

  if (msg.type === "refresh-success") {
    setAuthTokens({ access: msg.access, refresh: msg.refresh });
  }

  if (msg.type === "logout") {
    clearAuthTokens();
  }
});

/** ----------------------------
 *  REFRESH CONTROL
 * ----------------------------- */

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

type Subscriber = (newAccess: string) => void;
const refreshSubscribers: Subscriber[] = [];

function subscribeTokenRefresh(cb: Subscriber) {
  refreshSubscribers.push(cb);
}

function notifySubscribers(newAccess: string) {
  refreshSubscribers.forEach((cb) => cb(newAccess));
  refreshSubscribers.length = 0;
}

async function doRefresh(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Missing refresh token");

  const res = await fetch(baseURL + "/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error("Refresh failed");
  }

  const data = await res.json();
  const newAccess = data.access;
  const newRefresh = data.refresh;

  if (!newAccess) throw new Error("No access token returned");

  // Uloženie tokenov
  setAuthTokens({ access: newAccess, refresh: newRefresh });

  // Broadcast do ostatných tabov
  bc?.postMessage({ type: "refresh-success", access: newAccess, refresh: newRefresh });

  return newAccess;
}

async function refreshToken(): Promise<string> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  bc?.postMessage({ type: "refresh-start" });

  refreshPromise = doRefresh()
    .then((newAccess) => {
      notifySubscribers(newAccess);
      return newAccess;
    })
    .catch((err) => {
      clearAuthTokens();
      throw err;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, options),

  post: <T>(url: string, body: any, options: RequestInit = {}) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body: any, options: RequestInit = {}) =>
    request<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: any, options: RequestInit = {}) =>
    request<T>(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string, options: RequestInit = {}) =>
    request<T>(url, {
      ...options,
      method: "DELETE",
    }),
};
