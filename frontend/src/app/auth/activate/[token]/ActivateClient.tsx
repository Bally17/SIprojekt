"use client";

import { useEffect, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { api } from "@lib/api-client";
import { TokenVerify } from "@type/backend/TokenVerify";

type ActivateResponse = {
  message?: string;
  [key: string]: unknown;
};

export default function ActivateClient({ token }: Readonly<TokenVerify>) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState(msgs.auth.checking);

  useEffect(() => {
    const activate = async () => {
      try {
        const res = await api.get<ActivateResponse>(`/auth/activate/${token}/`);
        const successMessage = res?.message ?? msgs.auth.success;

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
  }, [token, msgs, notifySuccess, notifyWarning]);

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
