"use client";

import { useState } from "react";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useForgotPasswordMutation } from "src/hook/useForgotPasswordMutation";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const { msgs } = useLocalization();
  const { info: notifyInfo, warning: notifyWarning } = useSystemNotifications();

  const mutation = useForgotPasswordMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await mutation.mutateAsync({ email });

      notifyInfo({
        title: msgs.auth.submitted,
        description: msgs.auth.forgotPassword,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error_description ||
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        msgs.auth.error;

      notifyWarning({
        title: msgs.auth.error,
        description: message,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-ink-900 text-center">
        {msgs.auth.forgotPassword}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.description}</p>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={msgs.auth.yourEmail}
        required
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />

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
