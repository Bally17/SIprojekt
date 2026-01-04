"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useForm, type FieldErrors } from "react-hook-form";
import { getErrorMessage } from "@utils/errorActions";
import { useForgotPasswordMutation } from "../hooks";

type ForgotPasswordFormState = {
  email: string;
};

export default function ForgotPasswordForm() {
  const { msgs } = useLocalization();
  const { info: notifyInfo, warning: notifyWarning } = useSystemNotifications();
  const mutation = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormState>({
    defaultValues: { email: "" },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const onSubmit = async (form: ForgotPasswordFormState) => {
    try {
      await mutation.mutateAsync({ email: form.email });

      notifyInfo({
        title: msgs.auth.submitted,
        description: msgs.auth.forgotPassword,
      });

      reset();
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.error,
        description: getErrorMessage(err, msgs.auth.error),
      });
    }
  };

  const onInvalid = (errs: FieldErrors<ForgotPasswordFormState>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.error;

    notifyWarning({ title: msgs.auth.error, description: firstMessage });
  };

  const input =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";
  const errorText = "text-sm text-red-600";

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.forgotPassword}
      </h2>

      <p className="text-sm text-gray-600 text-center">{msgs.auth.description}</p>

      <div>
        <input
          type="email"
          placeholder={msgs.auth.yourEmail}
          className={input}
          {...register("email", {
            required: msgs.auth.error ?? "Email je povinný.",
          })}
        />
        {errors.email?.message && <p className={errorText}>{errors.email.message}</p>}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={mutation.isPending}
        loading={mutation.isPending}
      >
        {mutation.isPending ? msgs.auth.submitting : msgs.auth.submit}
      </Button>
    </form>
  );
}
