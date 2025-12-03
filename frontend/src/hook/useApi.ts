"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { request as apiRequest } from "@lib/api-client";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export const METHOD: { [key: string]: ApiMethod } = {
  HEAD: "HEAD",
  GET: "GET",
  POST: "POST",
  DELETE: "DELETE",
  PUT: "PUT",
  PATCH: "PATCH",
};

type BaseConfig<TResponse, TBody, TParams> = {
  url: string;
  method: ApiMethod;
  immediate?: boolean;
  initialData?: TResponse | null;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: any) => void;
};

type ExecuteArgs<TBody, TParams> = {
  body?: TBody;
  params?: TParams;
  signal?: AbortSignal;
  urlOverride?: string;
};

type UseApiResult<TResponse, TBody, TParams> = {
  data: TResponse | null;
  loading: boolean;
  error: any;
  execute: (args?: ExecuteArgs<TBody, TParams>) => Promise<TResponse>;
  reset: () => void;
};

function appendSearchParam(searchParams: URLSearchParams, key: string, value: unknown): void {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendSearchParam(searchParams, key, item);
    }
    return;
  }

  if (value instanceof Date) {
    searchParams.append(key, value.toISOString());
    return;
  }

  const type = typeof value;

  if (type === "string") {
    searchParams.append(key, value as string);
    return;
  }

  if (type === "number") {
    searchParams.append(key, (value as number).toString());
    return;
  }

  if (type === "boolean") {
    searchParams.append(key, (value as boolean) ? "true" : "false");
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized !== undefined) {
      searchParams.append(key, serialized);
    }
  } catch {
    // fallback: radšej nič nepridáme, hlavne nie String(value)
    // searchParams.append(key, "[unserializable]");
  }
}

function buildUrlWithParams<TParams>(baseUrl: string, params?: TParams): string {
  if (!params) return baseUrl;

  const entries = Object.entries(params as Record<string, unknown>);
  if (!entries.length) return baseUrl;

  const searchParams = new URLSearchParams();

  for (const [key, value] of entries) {
    appendSearchParam(searchParams, key, value);
  }

  const qs = searchParams.toString();
  if (!qs.length) return baseUrl;

  return `${baseUrl}?${qs}`;
}

function buildRequestOptions<TBody>(
  method: ApiMethod,
  body: TBody | undefined,
  signal?: AbortSignal,
): RequestInit {
  const options: RequestInit = { method, signal };

  if (method !== METHOD.GET && body !== undefined && body !== null) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  return options;
}

export function useApi<
  TResponse = unknown,
  TBody = unknown,
  TParams extends Record<string, any> = Record<string, any>,
>(config: BaseConfig<TResponse, TBody, TParams>): UseApiResult<TResponse, TBody, TParams> {
  const { url, method, immediate = false, initialData = null, onSuccess, onError } = config;

  const [data, setData] = useState<TResponse | null>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<any>(null);

  const hasFetchedRef = useRef(false);

  const execute = useCallback(
    async (args: ExecuteArgs<TBody, TParams> = {}): Promise<TResponse> => {
      const { body, params, signal, urlOverride } = args;

      setLoading(true);
      setError(null);

      try {
        const baseUrl = urlOverride ?? url;
        const finalUrl = buildUrlWithParams(baseUrl, params);
        const options = buildRequestOptions(method, body, signal);

        const response = await apiRequest<TResponse>(finalUrl, options);

        setData(response);
        onSuccess?.(response);

        return response;
      } catch (err) {
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, method, onSuccess, onError],
  );

  useEffect(() => {
    if (!immediate) return;
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    void execute();
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
}
