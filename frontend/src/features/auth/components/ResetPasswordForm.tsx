"use client";

import { useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";

type Props = {
  token: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // Ukladá zmeny z inputov podľa ich name atribútu

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // Po odoslaní formu volá API POST, a pošle token a passwordy.

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await axiosClient.post("/auth/password/reset/confirm/", {
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
      const message =
        err.response?.data?.error || err.response?.data?.message || msgs.auth.notNewPassword;
      notifyWarning({
        title: msgs.auth.error,
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
      >
        {loading ? msgs.auth.saving : msgs.auth.savePassword}
      </button>
    </form>
  );
}
