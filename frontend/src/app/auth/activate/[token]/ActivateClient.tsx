"use client";

import { useEffect, useState } from "react";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { TokenVerify } from "@shared-types/auth";
import { useActivateAccountQuery } from "@auth/hooks";

export default function ActivateClient({ token }: Readonly<TokenVerify>) {
  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState(msgs.auth.checking);

  const query = useActivateAccountQuery(token);

  const { isLoading, isSuccess, isError, data, error } = query;

  // extract only what you use from localization to keep deps precise
  const {
    checking,
    success,
    error: authErrorTitle,
    invalid,
    accountActivation,
    goToLogin,
  } = msgs.auth;

  useEffect(() => {
    if (isLoading) {
      setStatus("loading");
      setMessage(checking);
      return;
    }

    if (isSuccess) {
      const successMessage = data?.message ?? success;

      setMessage(successMessage);
      setStatus("success");

      notifySuccess({
        title: success,
        description: successMessage,
      });
      return;
    }

    if (isError) {
      const err: any = error;
      const description = err?.response?.data?.error ?? err?.response?.data?.message ?? invalid;

      setMessage(description);
      setStatus("error");

      notifyWarning({
        title: authErrorTitle,
        description,
      });
    }
  }, [
    isLoading,
    isSuccess,
    isError,
    data?.message,
    error,
    checking,
    success,
    invalid,
    authErrorTitle,
    notifySuccess,
    notifyWarning,
  ]);

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-ink-900-900">{accountActivation}</h1>

        <p className={status === "error" ? "text-red-600" : "text-gray-700"}>
          {isLoading ? checking : message}
        </p>

        {!isLoading && (
          <a
            href="/auth/login"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition"
          >
            {goToLogin}
          </a>
        )}
      </div>
    </main>
  );
}
