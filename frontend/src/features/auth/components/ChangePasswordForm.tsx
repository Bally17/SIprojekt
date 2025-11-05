"use client";

import { useState } from "react";
import { useLocalization } from "@/shared/i18n/client";

type ChangePasswordFormProps = {
  onSubmit?: (payload: {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }) => Promise<void> | void;

  loading?: boolean;
};

type FormState = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export default function ChangePasswordForm({ onSubmit, loading = false }: ChangePasswordFormProps) {
  const { msgs } = useLocalization();
  const [form, setForm] = useState<FormState>({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError("Nové heslo musí mať aspoň 8 znakov.");
      return;
    }

    if (form.newPassword !== form.newPasswordConfirm) {
      setError("Heslá sa nezhodujú.");
      return;
    }

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          newPasswordConfirm: form.newPasswordConfirm,
        });
      } else {
        // Zatiaľ len simulácia – backend sa doplní neskôr.
        console.info("ChangePasswordForm submit", form);
      }
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
    } catch (submitError: any) {
      setError(
        submitError?.message ||
          submitError?.response?.data?.detail ||
          "Nepodarilo sa zmeniť heslo. Skúste znova.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitting = submitting || loading;
  const inputClasses =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.setNewPassword}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.newPasswordInfoParagraph}</p>

      <div className="space-y-1">
        <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
          {msgs.auth.newGeneratedPassword}
        </label>
        <input
          id="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={handleChange("currentPassword")}
          className={inputClasses}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
          {msgs.auth.newPassword}
        </label>
        <input
          id="newPassword"
          type="password"
          value={form.newPassword}
          onChange={handleChange("newPassword")}
          className={inputClasses}
          required
          minLength={8}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="newPasswordConfirm" className="text-sm font-medium text-gray-700">
          {msgs.auth.confirmPassword}
        </label>
        <input
          id="newPasswordConfirm"
          type="password"
          value={form.newPasswordConfirm}
          onChange={handleChange("newPasswordConfirm")}
          className={inputClasses}
          required
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 text-center">{msgs.auth.succesResetPassword}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-900 text-white py-2 rounded hover:bg-primary-800 disabled:opacity-70 transition"
      >
        {isSubmitting ? "Ukladám..." : "Uložiť nové heslo"}
      </button>
    </form>
  );
}
