"use client";

import { useRouter } from "next/navigation";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useAuth } from "@lib/AuthProvider";
import { ChangePasswordPayload } from "@shared-types/auth";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";
import { useChangePasswordMutation } from "../hooks";
import { getProfileMissingFields } from "../api";

export default function ChangePasswordForm() {
  const { msgs } = useLocalization();
  const router = useRouter();
  const { user } = useAuth();

  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const mutation = useChangePasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordPayload>({
    defaultValues: {
      current_password: "",
      new_password: "",
      new_password_confirm: "",
    },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const newPassword = watch("new_password");

  const onSubmit = async (form: ChangePasswordPayload) => {
    try {
      const res = await mutation.mutateAsync({
        current_password: form.current_password,
        new_password: form.new_password,
        new_password_confirm: form.new_password_confirm,
      });

      const effectiveUser = (res as any)?.user ?? user;
      const roleKey = String(effectiveUser?.rola || effectiveUser?.role || "").toLowerCase();

      let redirect: string;

      if (roleKey === "firma") {
        redirect = "/dashboard/company";
      } else if (roleKey === "student") {
        redirect = "/dashboard/student";
      } else {
        redirect = "/dashboard";
      }

      if (roleKey === "firma") {
        try {
          const missing = await getProfileMissingFields();
          const missingFields = missing?.missing_required_fields ?? [];
          if (missingFields.length > 0) {
            redirect = "/auth/register/company/complete-info";
          }
        } catch {
          // fallback: keep dashboard redirect if profile check fails
        }
      }

      notifySuccess({
        title: msgs.auth.succesResetPassword,
        description: msgs.auth.setNewPassword,
      });

      router.push(redirect);
      reset();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.error,
        description: getErrorMessage(err, "Nepodarilo sa zmeniť heslo."),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<ChangePasswordPayload>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({ title: msgs.auth.error, description: firstMessage });
  };

  const isSubmitting = mutation.isPending;
  const inputClasses =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400";
  const errorText = "text-sm text-red-600";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.setNewPassword}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.newPasswordInfoParagraph}</p>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          {msgs.auth.newGeneratedPassword}
        </label>
        <input
          type="password"
          className={inputClasses}
          {...register("current_password", {
            required: msgs.auth.error ?? "Aktuálne heslo je povinné.",
          })}
        />
        {errors.current_password?.message && (
          <p className={errorText}>{errors.current_password.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.newPassword}</label>
        <input
          type="password"
          className={inputClasses}
          {...register("new_password", {
            required: msgs.auth.error ?? "Nové heslo je povinné.",
            minLength: {
              value: 8,
              message: msgs.auth.passwordTooShort ?? "Heslo musí mať aspoň 8 znakov.",
            },
          })}
        />
        {errors.new_password?.message && <p className={errorText}>{errors.new_password.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{msgs.auth.confirmPassword}</label>
        <input
          type="password"
          className={inputClasses}
          {...register("new_password_confirm", {
            required: msgs.auth.error ?? "Potvrdenie hesla je povinné.",
            minLength: {
              value: 8,
              message: msgs.auth.passwordTooShort ?? "Heslo musí mať aspoň 8 znakov.",
            },
            validate: (v) =>
              v === newPassword || (msgs.auth.passwordMismatch ?? "Heslá sa musia zhodovať."),
          })}
        />
        {errors.new_password_confirm?.message && (
          <p className={errorText}>{errors.new_password_confirm.message}</p>
        )}
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
