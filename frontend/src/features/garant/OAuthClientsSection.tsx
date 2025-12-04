"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { api } from "@lib/api-client";
import { useApiGetQuery, useApiMutation } from "@lib/api";
import { useAuth } from "@constants";

type OAuthClient = {
  client_id: string;
  name: string;
  redirect_uris: string[];
  scope?: string | null;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  service_user_id?: number | null;
  public_key?: string | null;
};

type CreateClientPayload = {
  name: string;
  redirect_uris: string[];
  scope?: string;
  client_id?: string;
  client_secret?: string;
  is_public: boolean;
  allow_password_grant: boolean;
  allow_private_jwt: boolean;
  public_key?: string;
  service_user_id?: number;
};

const initialFormState = {
  name: "",
  redirect_uris: "",
  scope: "read write",
  is_public: false,
  allow_password_grant: false,
  allow_private_jwt: false,
  public_key: "",
  service_user_id: "",
};

export default function OAuthClientsSection() {
  const { user } = useAuth();
  const { msgs } = useLocalization();
  const queryClient = useQueryClient();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [form, setForm] = useState(initialFormState);
  const [lastCredentials, setLastCredentials] = useState<{
    client_id?: string;
    client_secret?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: clients = [],
    isLoading,
    error,
  } = useApiGetQuery<OAuthClient[]>(["oauth-clients"], "/auth/oauth/clients/");

  const createMutation = useApiMutation<OAuthClient, CreateClientPayload>((payload) =>
    api.post("/auth/oauth/clients/", payload),
  );

  const deleteMutation = useApiMutation<void, string>((id) =>
    api.delete(`/auth/oauth/clients/${id}/`),
  );

  const parsedRedirects = useMemo(
    () =>
      form.redirect_uris
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    [form.redirect_uris],
  );

  if (user?.rola !== "garant") {
    return null;
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const target = event.target;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLastCredentials(null);
    setFormError(null);

    if (!form.name.trim()) {
      setFormError(msgs.common.oauth.validation.nameRequired);
      return;
    }

    if (!parsedRedirects.length) {
      setFormError(msgs.common.oauth.validation.redirectRequired);
      return;
    }

    for (const uri of parsedRedirects) {
      try {
        const parsed = new URL(uri);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Protocol must be http or https");
        }
      } catch {
        setFormError(msgs.common.oauth.validation.redirectInvalid.replace("{uri}", uri));
        return;
      }
    }

    if (form.allow_private_jwt && !form.public_key.trim()) {
      setFormError(msgs.common.oauth.validation.publicKeyRequired);
      return;
    }

    const payload: CreateClientPayload = {
      name: form.name.trim(),
      redirect_uris: parsedRedirects,
      scope: form.scope.trim() || undefined,
      is_public: form.is_public,
      allow_password_grant: form.allow_password_grant,
      allow_private_jwt: form.allow_private_jwt,
      service_user_id:
        form.service_user_id && Number(form.service_user_id) > 0
          ? Number(form.service_user_id)
          : undefined,
      public_key: form.allow_private_jwt ? form.public_key.trim() || undefined : undefined,
    };

    try {
      const created = await createMutation.mutateAsync(payload);
      setLastCredentials({
        client_id: (created as any).client_id,
        client_secret: (created as any).client_secret,
      });
      notifySuccess({
        title: msgs.common.successTitle,
        description: msgs.common.success,
      });
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
    } catch (err: any) {
      const resp = err?.response?.data;
      const description =
        resp?.detail ||
        resp?.error ||
        resp?.message ||
        (typeof resp === "string" ? resp : "") ||
        err?.message ||
        msgs.common.error.errorSave;
      if (description) {
        setFormError(description);
      }
      notifyWarning({
        title: msgs.common.error.errorSave,
        description,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(msgs.common.oauth.deleteConfirm);
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: ["oauth-clients"] });
      notifySuccess({
        title: msgs.common.successTitle,
        description: msgs.common.oauth.deleteSuccess,
      });
    } catch (err: any) {
      const description =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        msgs.common.error.errorDelete;
      notifyWarning({
        title: msgs.common.error.errorDelete,
        description,
      });
    }
  };

  return (
    <section className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
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
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
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

        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-900">
              {msgs.common.oauth.form.title}
            </h3>
            {createMutation.isPending ? (
              <span className="text-xs text-ink-400">{msgs.common.loading.loading}</span>
            ) : null}
          </div>
          {formError ? (
            <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}
          <form className="mt-4 space-y-4" onSubmit={handleCreate}>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.name}
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.redirectUris}
              </label>
              <textarea
                name="redirect_uris"
                value={form.redirect_uris}
                onChange={handleInputChange}
                placeholder={msgs.common.oauth.form.placeholder.redirectUris}
                rows={3}
                required
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
              <p className="mt-1 text-xs text-ink-400">
                {msgs.common.oauth.form.hint.redirectUris}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.scope}
              </label>
              <input
                type="text"
                name="scope"
                value={form.scope}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={form.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                />
                {msgs.common.oauth.form.labels.publicClient}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="allow_password_grant"
                  checked={form.allow_password_grant}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                />
                {msgs.common.oauth.form.labels.passwordGrant}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
                <input
                  type="checkbox"
                  name="allow_private_jwt"
                  checked={form.allow_private_jwt}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-700 focus:ring-primary-400"
                />
                {msgs.common.oauth.form.labels.privateKeyJwt}
              </label>
            </div>
            {form.allow_private_jwt ? (
              <div>
                <label className="text-xs font-semibold uppercase text-ink-500">
                  {msgs.common.oauth.form.labels.publicKey}
                </label>
                <textarea
                  name="public_key"
                  value={form.public_key}
                  onChange={handleInputChange}
                  placeholder={msgs.common.oauth.form.placeholder.publicKey}
                  rows={3}
                  required
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
                />
              </div>
            ) : null}
            <div>
              <label className="text-xs font-semibold uppercase text-ink-500">
                {msgs.common.oauth.form.labels.serviceUserId}
              </label>
              <input
                type="number"
                name="service_user_id"
                value={form.service_user_id}
                onChange={handleInputChange}
                placeholder={msgs.common.oauth.form.placeholder.serviceUserId}
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-300"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-md bg-primary-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
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
