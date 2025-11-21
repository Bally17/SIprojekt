"use client";

import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import axiosClient from "@lib/axiosClient";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { msgs } = useLocalization();
  const { info: notifyInfo, warning: notifyWarning } = useSystemNotifications();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await axiosClient.post("/auth/password/reset/", { email });
      notifyInfo({
        title: msgs.auth.submitted,
        description: msgs.auth.forgotPassword,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || msgs.auth.error;
      notifyWarning({
        title: msgs.auth.error,
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.forgotPassword}
      </h2>
      <p className="text-sm text-gray-600 text-center">{msgs.auth.description}</p>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={msgs.auth.yourEmail}
        required
        className="w-full border rounded px-3 py-2"
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
        loading={loading}
      >
        {loading ? msgs.auth.submitting : msgs.auth.submit}
      </Button>
    </form>
  );
}
