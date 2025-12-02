"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { api } from "@lib/api-client";

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

type User = {
  rola?: string;
  role?: string;
  [key: string]: unknown;
};

type ChangePasswordResponse = {
  user?: User | null;
};

type ProfileResponse = {
  user?: User | null;
};

export default function ChangePasswordForm({
  onSubmit,
  loading = false,
}: Readonly<ChangePasswordFormProps>) {
  const { msgs } = useLocalization();
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const defaultSubmit = useCallback(
    async ({
      currentPassword,
      newPassword,
      newPasswordConfirm,
    }: {
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
    }) => {
      const response = await api.post<ChangePasswordResponse>("/auth/password/change/", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });

      let latestUser: User | null = response.user ?? null;

      if (!latestUser) {
        try {
          const profile = await api.get<ProfileResponse>("/auth/profile/");
          latestUser = profile.user ?? null;
        } catch {
          latestUser = null;
        }
      }

      if (latestUser) {
        localStorage.setItem("user", JSON.stringify(latestUser));
      }

      const roleKey = String(latestUser?.rola || latestUser?.role || "").toLowerCase();
      const redirectTarget = roleKey === "firma" ? "/dashboard/company" : "/dashboard/student";

      router.push(redirectTarget);
    },
    [router],
  );

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.newPassword.length < 8) {
      notifyWarning({
        title: msgs.auth.error,
        description: msgs.auth.passwordTooShort,
      });
      return;
    }

    if (form.newPassword !== form.newPasswordConfirm) {
      notifyWarning({
        title: msgs.auth.error,
        description: msgs.auth.passwordMismatch,
      });
      return;
    }

    try {
      setSubmitting(true);
      const submitHandler = onSubmit ?? defaultSubmit;
      await submitHandler({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        newPasswordConfirm: form.newPasswordConfirm,
      });
      notifySuccess({
        title: msgs.auth.succesResetPassword,
        description: msgs.auth.setNewPassword,
      });
      setForm({ currentPassword: "", newPassword: "", newPasswordConfirm: "" });
    } catch (submitError: any) {
      const message =
        submitError?.message ||
        submitError?.response?.data?.detail ||
        "Nepodarilo sa zmeniť heslo. Skúste znova.";
      notifyWarning({
        title: msgs.auth.error,
        description: message,
      });
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
