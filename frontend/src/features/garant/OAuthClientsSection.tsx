"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { useAuth } from "@lib/AuthProvider";
import { CreateOAuthClientPayload } from "@shared-types/oauth";
import { getOAuthClients, createOAuthClient, deleteOAuthClient } from "src/api/oauth-api";
import { useForm } from "react-hook-form";
import { getErrorMessage } from "@utils/errorActions";

type OAuthClientFormValues = {
  name: string;
  redirect_uris: string; // textarea (newline-separated)
  scope: string;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  public_key: string;
  service_user_id: string; // input number, držíme ako string (ľahšie pre RHF)
};

const initialFormState: OAuthClientFormValues = {
  name: "",
  redirect_uris: "",
  scope: "read write",
  is_public: false,
  allow_password_grant: false,
  allow_private_jwt: false,
  public_key: "",
  service_user_id: "",
};

function parseRedirectUris(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function validateRedirectUris(value: string, msgs: any): true | string {
  const parsed = parseRedirectUris(value);
  if (!parsed.length) return msgs.common.oauth.validation.redirectRequired;

  for (const uri of parsed) {
    try {
      const u = new URL(uri);
      if (!["http:", "https:"].includes(u.protocol)) {
        return msgs.common.oauth.validation.redirectInvalid.replace("{uri}", uri);
      }
    } catch {
      return msgs.common.oauth.validation.redirectInvalid.replace("{uri}", uri);
    }
  }

  return true;
}

export default function OAuthClientsSection() {
  const { user } = useAuth();
  const { msgs } = useLocalization();
  const { success, warning } = useSystemNotifications();
  const queryClient = useQueryClient();

  // HOOKY mimo podmienok
  const clientsQuery = useQuery({
    queryKey: ["oauth-clients"],
    queryFn: getOAuthClients,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateOAuthClientPayload) => createOAuthClient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oauth-clients"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOAuthClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["oauth-clients"] }),
  });

  // RHF
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<OAuthClientFormValues>({
    defaultValues: initialFormState,
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const allowPrivateJwt = watch("allow_private_jwt");
  const redirectUrisRaw = watch("redirect_uris");

  const parsedRedirects = useMemo(
    () => parseRedirectUris(redirectUrisRaw || ""),
    [redirectUrisRaw],
  );

  // UI state mimo formulára
  const [lastCredentials, setLastCredentials] = useState<{
    client_id?: string;
    client_secret?: string;
  } | null>(null);

  // PODMIENKA iba na render
  if (user?.rola !== "garant") return null;

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------

  const onCreate = handleSubmit(async (values) => {
    setLastCredentials(null);
    clearErrors();

    const redirectValidation = validateRedirectUris(values.redirect_uris, msgs);
    if (redirectValidation !== true) {
      setError("redirect_uris", { type: "validate", message: redirectValidation });
      return;
    }

    if (values.allow_private_jwt && !values.public_key.trim()) {
      setError("public_key", {
        type: "validate",
        message: msgs.common.oauth.validation.publicKeyRequired,
      });
      return;
    }

    const serviceUserIdNum =
      values.service_user_id && Number(values.service_user_id) > 0
        ? Number(values.service_user_id)
        : undefined;

    const payload: CreateOAuthClientPayload = {
      name: values.name.trim(),
      redirect_uris: parsedRedirects,
      scope: values.scope.trim() || undefined,
      is_public: values.is_public,
      allow_password_grant: values.allow_password_grant,
      allow_private_jwt: values.allow_private_jwt,
      public_key: values.allow_private_jwt ? values.public_key.trim() : undefined,
      service_user_id: serviceUserIdNum,
    };

    try {
      const created = await createMutation.mutateAsync(payload);

      setLastCredentials({
        client_id: (created as any)?.client_id,
        client_secret: (created as any)?.client_secret,
      });

      success({ title: msgs.common.successTitle, description: msgs.common.success });

      reset(initialFormState);
    } catch (err: unknown) {
      const description = getErrorMessage(err, msgs.common.error.errorSave);
      // všeobecná chyba formulára – dáme na name, nech sa zobrazí hore
      setError("name", { type: "server", message: description });
      warning({ title: msgs.common.error.errorSave, description });
    }
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm(msgs.common.oauth.deleteConfirm)) return;

    try {
      await deleteMutation.mutateAsync(id);
      success({ title: msgs.common.successTitle, description: msgs.common.oauth.deleteSuccess });
    } catch (err: unknown) {
      const description = getErrorMessage(err, msgs.common.error.errorDelete);
      warning({ title: msgs.common.error.errorDelete, description });
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const clients = clientsQuery.data ?? [];
  const isLoading = clientsQuery.isLoading;
  const error = clientsQuery.error;

  return (
    <section className="space-y-6 rounded-lg border border-primary-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold text-primary-900">{msgs.common.oauth.title}</h2>
        <p className="text-sm text-ink-500">{msgs.common.oauth.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              {msgs.common.oauth.active}
            </p>
            {isLoading ? (
              <span className="text-xs text-ink-400">{msgs.common.loading.loading}</span>
            ) : null}
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-primary-200">
            <table className="min-w-full divide-y divide-primary-100">
              <thead className="bg-primary-50 border-b border-primary-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.oauth.table.clientId}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.oauth.table.name}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.oauth.table.redirectUris}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.oauth.table.scope}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {msgs.common.oauth.table.actions}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-600">
                      {msgs.common.error.errorLoad}
                    </td>
                  </tr>
                ) : !clients.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-400">
                      {msgs.common.oauth.empty}
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.client_id}>
                      <td className="px-4 py-3 text-sm font-mono text-primary-900">
                        {client.client_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-900">{client.name}</td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        <ul className="space-y-1">
                          {client.redirect_uris.map((uri) => (
                            <li key={uri} className="break-words text-xs text-ink-500">
                              {uri}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">{client.scope || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDelete(client.client_id)}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <Icon name="x" className="h-4 w-4" />
                          {msgs.common.oauth.delete}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-primary-100 bg-primary-50 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-900">
              {msgs.common.oauth.form.title}
            </h3>
            {createMutation.isPending ? (
              <span className="text-xs text-ink-400">{msgs.common.loading.loading}</span>
            ) : null}
          </div>

          {/* “globálna” chyba – použijeme name error ako top banner (server error) */}
          {errors.name?.type === "server" && errors.name.message ? (
            <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.name.message}
            </div>
          ) : null}

          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.name}
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                {...register("name", {
                  required: msgs.common.oauth.validation.nameRequired,
                  validate: (v) => v.trim().length > 0 || msgs.common.oauth.validation.nameRequired,
                })}
              />
              {errors.name?.type !== "server" && errors.name?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              ) : null}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.redirectUris}
              </label>
              <textarea
                rows={3}
                placeholder={msgs.common.oauth.form.placeholder.redirectUris}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                {...register("redirect_uris", {
                  required: msgs.common.oauth.validation.redirectRequired,
                  validate: (v) => validateRedirectUris(v, msgs),
                })}
              />
              <p className="mt-1 text-xs text-ink-400">
                {msgs.common.oauth.form.hint.redirectUris}
              </p>
              {errors.redirect_uris?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.redirect_uris.message}</p>
              ) : null}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.scope}
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                {...register("scope")}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                  {...register("is_public")}
                />
                {msgs.common.oauth.form.labels.publicClient}
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                  {...register("allow_password_grant")}
                />
                {msgs.common.oauth.form.labels.passwordGrant}
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                  {...register("allow_private_jwt")}
                />
                {msgs.common.oauth.form.labels.privateKeyJwt}
              </label>
            </div>

            {allowPrivateJwt ? (
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.oauth.form.labels.publicKey}
                </label>
                <textarea
                  rows={3}
                  placeholder={msgs.common.oauth.form.placeholder.publicKey}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                  {...register("public_key", {
                    validate: (v) =>
                      allowPrivateJwt
                        ? v.trim().length > 0 || msgs.common.oauth.validation.publicKeyRequired
                        : true,
                  })}
                />
                {errors.public_key?.message ? (
                  <p className="mt-1 text-xs text-red-600">{errors.public_key.message}</p>
                ) : null}
              </div>
            ) : null}

            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.serviceUserId}
              </label>
              <input
                type="number"
                placeholder={msgs.common.oauth.form.placeholder.serviceUserId}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                {...register("service_user_id", {
                  validate: (v) => {
                    if (!v) return true;
                    const n = Number(v);
                    if (!Number.isFinite(n)) return msgs.common.oauth.validation.serviceUserInvalid;
                    if (n <= 0) return msgs.common.oauth.validation.serviceUserInvalid;
                    return true;
                  },
                })}
              />
              {errors.service_user_id?.message ? (
                <p className="mt-1 text-xs text-red-600">{errors.service_user_id.message}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
            >
              {createMutation.isPending
                ? msgs.common.loading.loading
                : msgs.common.oauth.form.submit}
            </button>
          </form>

          {lastCredentials ? (
            <div className="mt-4 space-y-2 rounded-md border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                {msgs.common.oauth.newCredentials.title}
              </p>
              {lastCredentials.client_id ? (
                <p>
                  {msgs.common.oauth.newCredentials.clientId}{" "}
                  <span className="font-mono">{lastCredentials.client_id}</span>
                </p>
              ) : null}
              {lastCredentials.client_secret ? (
                <p>
                  {msgs.common.oauth.newCredentials.clientSecret}{" "}
                  <span className="font-mono">{lastCredentials.client_secret}</span>
                </p>
              ) : null}
              <p className="text-xs text-primary-700">{msgs.common.oauth.newCredentials.note}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
