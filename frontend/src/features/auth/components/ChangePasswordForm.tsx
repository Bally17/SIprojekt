"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useAuth } from "@lib/AuthProvider";
import { useChangePasswordMutation } from "src/hook/useChangePasswordMutation";
import { ChangePasswordPayload } from "@shared-types/auth";

export default function ChangePasswordForm() {
  const { msgs } = useLocalization();
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState<ChangePasswordPayload>({
    current_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const mutation = useChangePasswordMutation();

  const handleChange =
    (field: keyof ChangePasswordPayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { current_password, new_password, new_password_confirm } = form;

    if (new_password.length < 8) {
      notifyWarning({ title: msgs.auth.error, description: msgs.auth.passwordTooShort });
      return;
    }

    if (new_password !== new_password_confirm) {
      notifyWarning({ title: msgs.auth.error, description: msgs.auth.passwordMismatch });
      return;
    }

    try {
      // API request
      const res = await mutation.mutateAsync({
        current_password: current_password,
        new_password: new_password,
        new_password_confirm: new_password_confirm,
      });

      // Preferujeme user z API, inak vezmeme user z AuthProvideru
      const effectiveUser = res.user ?? user;

      // Presmerovanie podľa role
      const roleKey = String(effectiveUser?.rola || effectiveUser?.role || "").toLowerCase();

      const redirect =
        roleKey === "firma"
          ? "/dashboard/company"
          : roleKey === "student"
            ? "/dashboard/student"
            : "/dashboard";

      notifySuccess({
        title: msgs.auth.succesResetPassword,
        description: msgs.auth.setNewPassword,
      });

      router.push(redirect);

      // Reset form
      setForm({
        current_password: "",
        new_password: "",
        new_password_confirm: "",
      });
    } catch (err: any) {
      const description =
        err?.response?.data?.message ||
        err?.response?.data?.error_description ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Nepodarilo sa zmeniť heslo.";

      notifyWarning({
        title: msgs.auth.error,
        description,
      });
    }
  };

  const isSubmitting = mutation.isPending;
  const inputClasses =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.setNewPassword}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.newPasswordInfoParagraph}</p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {msgs.auth.newGeneratedPassword}
        </label>
        <input
          type="password"
          value={form.current_password}
          onChange={handleChange("current_password")}
          className={inputClasses}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.newPassword}</label>
        <input
          type="password"
          value={form.new_password}
          onChange={handleChange("new_password")}
          className={inputClasses}
          required
          minLength={8}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.confirmPassword}</label>
        <input
          type="password"
          value={form.new_password_confirm}
          onChange={handleChange("new_password_confirm")}
          className={inputClasses}
          required
          minLength={8}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        {isSubmitting ? "Ukladám..." : "Uložiť nové heslo"}
      </Button>
    </form>
  );
}
