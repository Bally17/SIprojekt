// src/lib/axiosClient.ts
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

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
    if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
  }
  bc?.postMessage({ type: "refresh-success", access: tokens.access, refresh: tokens.refresh } as BroadcastMsg);
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
const getRefreshToken = () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null);

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
    // Prevezmi nový access/refresh aj v ostatných taboch
    setAuthTokens({ access: msg.access, refresh: msg.refresh });
  }

  if (msg.type === "logout") {
    // Vyčisti lokálne a nechaj UI riešiť redirect/log out flow
    accessTokenMemory = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ACCESS_SS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  }
});

/** Vykoná refresh – rešpektuje ROTATE_REFRESH_TOKENS=True (vracia aj nový refresh) */
const doRefresh = async (): Promise<string> => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("Missing refresh token");
  }

  // Odošli refresh požiadavku (bez withCredentials – nepoužívame cookies)
  const res = await axios.post(
    `${baseURL}/auth/token/refresh/`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );

  const newAccess: string | undefined = res.data?.access;
  const newRefresh: string | undefined = res.data?.refresh; // SimpleJWT vráti, ak ROTATE=True

  if (!newAccess) throw new Error("Refresh response missing access token");

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

/** Axios inštancia */
const axiosClient = axios.create({
  baseURL,
  withCredentials: false, // nepoužívame auth cookies
});

/** REQUEST interceptor – pridaj Bearer pre ne-Whitelisted volania */
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!isWhitelisted(config.url)) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** RESPONSE interceptor – 401 => pokús sa o refresh (raz), queue retry ak refresh prebieha */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config || {};
    const status = error?.response?.status;

    // Ak je to 401 na chránenom endpointe a ešte sme neskúšali retry
    if (status === 401 && !original._retry && !isWhitelisted(original.url)) {
      original._retry = true;

      try {
        if (isRefreshing && refreshPromise) {
          // Počkaj na prebiehajúci refresh
          const newAccess = await new Promise<string>((resolve, reject) => {
            subscribeTokenRefresh(resolve);
            // Bez timeoutu – voliteľne môžeš pridať ochranný timeout
          });
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAccess}` };
          return axiosClient(original);
        }

        // Spusť svoj refresh
        const newAccess = await refreshToken();
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAccess}` };
        return axiosClient(original);
      } catch (refreshErr) {
        // Refresh zlyhal -> odhlás
        clearAuthTokens();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
