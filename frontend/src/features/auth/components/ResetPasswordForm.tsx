"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useResetPasswordMutation } from "src/hook/useResetPasswordMutation";
import { TokenVerify } from "@shared-types/auth";
import { ResetPasswordFormState } from "@shared-types/index";
import { getErrorMessage } from "@utils/errorActions";
import { useForm, type FieldErrors } from "react-hook-form";

export default function ResetPasswordForm({ token }: Readonly<TokenVerify>) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const mutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormState>({
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (form: ResetPasswordFormState) => {
    try {
      await mutation.mutateAsync({
        token,
        new_password: form.newPassword,
        new_password_confirm: form.confirmPassword,
      });

      reset();

      notifySuccess({
        title: msgs.auth.succesResetPassword,
        description: msgs.auth.setNewPassword,
      });
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<ResetPasswordFormState>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({
      title: msgs.auth.errorTitle,
      description: firstMessage,
    });
  };

  const input =
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

      <div>
        <input
          type="password"
          placeholder={msgs.auth.newPassword}
          className={input}
          {...register("newPassword", {
            required: msgs.auth.error ?? "Heslo je povinné.",
            minLength: {
              value: 8,
              message: msgs.auth.passwordTooShort ?? "Heslo musí mať aspoň 8 znakov.",
            },
          })}
        />
        {errors.newPassword?.message && <p className={errorText}>{errors.newPassword.message}</p>}
      </div>

      <div>
        <input
          type="password"
          placeholder={msgs.auth.confirmPassword}
          className={input}
          {...register("confirmPassword", {
            required: msgs.auth.error ?? "Potvrdenie hesla je povinné.",
            validate: (v) =>
              v === newPassword || (msgs.auth.passwordMismatch ?? "Heslá sa musia zhodovať."),
          })}
        />
        {errors.confirmPassword?.message && (
          <p className={errorText}>{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={mutation.isPending}
        loading={mutation.isPending}
      >
        {mutation.isPending ? msgs.auth.saving : msgs.auth.savePassword}
      </Button>
    </form>
  );
}
