"use client";

import { useState } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { api } from "@lib/api-client";
import { TokenVerify } from "@type/backend/TokenVerify";

type ResetPasswordFormState = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordForm({ token }: Readonly<TokenVerify>) {
  const [form, setForm] = useState<ResetPasswordFormState>({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.newPassword.length < 8) {
      notifyWarning({
        title: msgs.auth.error,
        description: msgs.auth.passwordTooShort ?? "Heslo musí mať aspoň 8 znakov.",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      notifyWarning({
        title: msgs.auth.error,
        description: msgs.auth.passwordMismatch ?? "Heslá sa musia zhodovať.",
      });
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/password/reset/confirm/", {
        token,
        new_password: form.newPassword,
        new_password_confirm: form.confirmPassword,
      });

      setForm({ newPassword: "", confirmPassword: "" });

      notifySuccess({
        title: msgs.auth.succesResetPassword,
        description: msgs.auth.setNewPassword,
      });
    } catch (err: any) {
      const data = err?.response?.data;
      const message = data?.error || data?.detail || data?.message || msgs.auth.notNewPassword;

      notifyWarning({
        title: msgs.auth.error,
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.setNewPassword}
      </h2>

      <input
        type="password"
        name="newPassword"
        placeholder={msgs.auth.newPassword}
        value={form.newPassword}
        onChange={handleChange}
        className={input}
        required
        minLength={8}
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder={msgs.auth.confirmPassword}
        value={form.confirmPassword}
        onChange={handleChange}
        className={input}
        required
        minLength={8}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
        loading={loading}
        aria-busy={loading}
      >
        {loading ? msgs.auth.saving : msgs.auth.savePassword}
      </Button>
    </form>
  );
}
