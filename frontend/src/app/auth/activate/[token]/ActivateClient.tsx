"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";

type Props = { token: string };

export default function ActivateClient({ token }: Props) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState(msgs.auth.checking);

  useEffect(() => {
    const activate = async () => {
      try {
        const res = await axiosClient.get(`/auth/activate/${token}/`);
        const successMessage = res.data?.message ?? msgs.auth.success;
        setMessage(successMessage);
        setStatus("success");
        notifySuccess({
          title: msgs.auth.success,
          description: successMessage,
        });
      } catch (error: any) {
        const description =
          error?.response?.data?.error ?? error?.response?.data?.message ?? msgs.auth.invalid;
        setMessage(description);
        setStatus("error");
        notifyWarning({
          title: msgs.auth.error,
          description,
        });
      }
    };
    activate();
  }, [token, msgs, notifySuccess, notifyWarning]); // msgsRef je stabilný → ESLint OK, žiadne i18n stringy v deps

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-primary-900">{msgs.auth.accountActivation}</h1>
        <p className={status === "error" ? "text-red-600" : "text-gray-700"}>{message}</p>

        {status !== "loading" && (
          <a
            href="/auth/login"
            className="inline-block bg-primary-900 text-white px-4 py-2 rounded hover:bg-primary-800 transition"
          >
            {msgs.auth.goToLogin}
          </a>
        )}
      </div>
    </main>
  );
}
