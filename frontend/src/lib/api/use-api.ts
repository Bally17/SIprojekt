"use client";

import {
  useQuery,
  useMutation,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { api } from "@lib/api-client";

/**
 * Typ pre options, ktoré sa dajú doplniť k useApiQuery
 * (zakázali sme prepisovať queryKey a queryFn).
 */
type UseApiQueryOptions<TData, TError, TKey extends QueryKey> = Omit<
  UseQueryOptions<TData, TError, TData, TKey>,
  "queryKey" | "queryFn"
>;

/**
 * Všeobecný wrapper pre useQuery.
 *
 * Použitie:
 *   const query = useApiQuery(["profile"], () => getProfile());
 */
export function useApiQuery<TData = unknown, TError = unknown, TKey extends QueryKey = QueryKey>(
  queryKey: TKey,
  queryFn: () => Promise<TData>,
  options?: UseApiQueryOptions<TData, TError, TKey>,
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError, TData, TKey>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Shortcut pre najčastejšie GET-y cez náš api-client.
 *
 * Použitie:
 *   const q = useApiGetQuery<User>(["profile"], "/auth/profile/");
 */
export function useApiGetQuery<TData = unknown, TError = unknown, TKey extends QueryKey = QueryKey>(
  queryKey: TKey,
  url: string,
  options?: UseApiQueryOptions<TData, TError, TKey>,
): UseQueryResult<TData, TError> {
  return useApiQuery<TData, TError, TKey>(queryKey, () => api.get<TData>(url), options);
}

/**
 * Typ pre options pri mutáciách (onSuccess, onError, atď.).
 */
type UseApiMutationOptions<TData, TError, TVariables> = UseMutationOptions<
  TData,
  TError,
  TVariables
>;

/**
 * Všeobecný wrapper pre useMutation.
 *
 * Použitie:
 *   const mutation = useApiMutation(loginFn);
 *   mutation.mutate({ email, password, role: "student" });
 */
export function useApiMutation<TData = unknown, TVariables = void, TError = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseApiMutationOptions<TData, TError, TVariables>,
): UseMutationResult<TData, TError, TVariables> {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}
