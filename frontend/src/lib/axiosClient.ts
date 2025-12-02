// src/lib/axiosClient.ts
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/** Endpointy, ktoré nevyžadujú Authorization: Bearer a nebudú retryované po refreshi */
const AUTH_WHITELIST = [
  "/auth/login/",
  "/auth/register/student/",
  "/auth/register/company/",
  "/auth/password/reset/",
  "/auth/password/reset/confirm/",
  "/auth/token/",
  "/auth/token/refresh/",
  "/auth/oauth/token/",
];

/** Pomôcka: je URL whitelisted? */
const isWhitelisted = (url?: string) => !!url && AUTH_WHITELIST.some((p) => url.includes(p));

/** In-memory access token (bezpečnejšie než localStorage) + per-tab prežitie cez sessionStorage */
let accessTokenMemory: string | null = null;
/** Refresh token držíme v localStorage (dlhšia životnosť) */
const REFRESH_KEY = "refresh_token";
const ACCESS_SS_KEY = "access_token_ss";

/** Pomocné broadcast správy pre viac tabov */
type BroadcastMsg =
  | { type: "refresh-start" }
  | { type: "refresh-success"; access: string; refresh?: string }
  | { type: "logout" };

const bc = typeof window !== "undefined" ? new BroadcastChannel("auth") : null;

/** Načítaj access z sessionStorage pri reloade tabu */
const loadInitialTokens = () => {
  if (typeof window === "undefined") return;
  const a = sessionStorage.getItem(ACCESS_SS_KEY);
  if (a) accessTokenMemory = a;
};
loadInitialTokens();

/** API na práci s tokenmi (použi po logine / pri logoute) */
export const setAuthTokens = (tokens: { access: string; refresh?: string }) => {
  accessTokenMemory = tokens.access;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(ACCESS_SS_KEY, tokens.access);
    if (tokens.refresh) {
      localStorage.setItem(REFRESH_KEY, tokens.refresh);
    }
  }

  // informuj ostatné tably
  bc?.postMessage({
    type: "refresh-success",
    access: tokens.access,
    refresh: tokens.refresh,
  } as BroadcastMsg);
};

export const clearAuthTokens = () => {
  accessTokenMemory = null;

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ACCESS_SS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  bc?.postMessage({ type: "logout" } as BroadcastMsg);
};

const getAccessToken = () => accessTokenMemory;
const getRefreshToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;

/** Koordinácia refreshu medzi requestami v jednom tabe */
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
type Subscriber = (newAccess: string) => void;
const refreshSubscribers: Subscriber[] = [];

const subscribeTokenRefresh = (cb: Subscriber) => refreshSubscribers.push(cb);
const onRefreshed = (newAccess: string) => {
  refreshSubscribers.forEach((cb) => cb(newAccess));
  refreshSubscribers.length = 0;
};

/** Broadcast koordinácia medzi tabmi */
bc?.addEventListener("message", (ev: MessageEvent<BroadcastMsg>) => {
  const msg = ev.data;
  if (!msg) return;

  if (msg.type === "refresh-success") {
    // Prevezmi nový access/refresh aj v ostatných taboch – ale bez ďalšieho broadcastu
    accessTokenMemory = msg.access;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(ACCESS_SS_KEY, msg.access);
      if (msg.refresh) {
        localStorage.setItem(REFRESH_KEY, msg.refresh);
      }
    }
  }

  if (msg.type === "logout") {
    accessTokenMemory = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ACCESS_SS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  }
});

/** Pomocný typ pre HTTP odpoveď (podobné AxiosResponse) */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

/** Povolené HTTP metódy */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

/** Interné options – dopĺňame _retry flag */
interface InternalRequestOptions extends RequestOptions {
  _retry?: boolean;
  method?: HttpMethod;
}

/** Vykoná refresh – rešpektuje ROTATE_REFRESH_TOKENS=True (vracia aj nový refresh) */
const doRefresh = async (): Promise<string> => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("Missing refresh token");
  }

  const res = await fetch(`${baseURL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    credentials: "omit",
  });

  if (!res.ok) {
    throw new Error(`Refresh failed with status ${res.status}`);
  }

  const data: any = await safeParseJson(res);
  const newAccess: string | undefined = data?.access;
  const newRefresh: string | undefined = data?.refresh;

  if (!newAccess) {
    throw new Error("Refresh response missing access token");
  }

  setAuthTokens({ access: newAccess, refresh: newRefresh });
  return newAccess;
};

/** Vstupný bod na refresh s „single-flight“ lockom */
const refreshToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  bc?.postMessage({ type: "refresh-start" } as BroadcastMsg);

  refreshPromise = doRefresh()
    .then((newAccess) => {
      onRefreshed(newAccess);
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
};

/** Bezpečné parsovanie JSON; ak nie je JSON, vráti text */
const safeParseJson = async (res: Response): Promise<any> => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Vytvor error podobný AxiosError, aby fungovalo err.response.data */
const createHttpError = async (res: Response): Promise<any> => {
  const data = await safeParseJson(res);
  const error: any = new Error(`HTTP error ${res.status}`);
  error.status = res.status;
  error.response = {
    status: res.status,
    data,
    headers: res.headers,
  };
  return error;
};

/** Hlavný request helper – náhrada za Axios interceptory */
const request = async <T = any>(
  url: string,
  options: InternalRequestOptions = {},
): Promise<HttpResponse<T>> => {
  const fullUrl = `${baseURL}${url}`;
  const isProtected = !isWhitelisted(url);

  const headers = new Headers(options.headers || {});

  // Pridaj Bearer token pre chránené endpointy
  if (isProtected) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(fullUrl, {
    method: options.method || "GET",
    headers,
    body: options.body,
    signal: options.signal,
    credentials: "omit", // nepoužívame cookies
  });

  const status = res.status;

  // 401 na chránenom endpointe – snažíme sa o refresh + 1x retry
  if (status === 401 && isProtected && !options._retry) {
    try {
      if (isRefreshing && refreshPromise) {
        // Počkaj na prebiehajúci refresh z iného requestu
        const newAccess = await new Promise<string>((resolve) => {
          subscribeTokenRefresh(resolve);
        });

        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${newAccess}`);

        return request<T>(url, {
          ...options,
          headers: Object.fromEntries(retryHeaders.entries()),
          _retry: true,
        });
      }

      // Spusť svoj refresh
      const newAccess = await refreshToken();

      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${newAccess}`);

      return request<T>(url, {
        ...options,
        headers: Object.fromEntries(retryHeaders.entries()),
        _retry: true,
      });
    } catch (refreshErr) {
      clearAuthTokens();
      throw refreshErr;
    }
  }

  // Iné chyby než 2xx/3xx -> vyhoď error podobný AxiosError
  if (!res.ok) {
    throw await createHttpError(res);
  }

  const data = (await safeParseJson(res)) as T;

  return {
    data,
    status: res.status,
    headers: res.headers,
  };
};

/** Verejné API podobné Axios inštancii */
const httpClient = {
  get: <T = any>(url: string, config?: RequestOptions) =>
    request<T>(url, { ...config, method: "GET" }),
  delete: <T = any>(url: string, config?: RequestOptions) =>
    request<T>(url, { ...config, method: "DELETE" }),
  post: <T = any>(url: string, body?: any, config?: RequestOptions) =>
    request<T>(url, {
      ...config,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    }),
  put: <T = any>(url: string, body?: any, config?: RequestOptions) =>
    request<T>(url, {
      ...config,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    }),
  patch: <T = any>(url: string, body?: any, config?: RequestOptions) =>
    request<T>(url, {
      ...config,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    }),
};

export default httpClient;
