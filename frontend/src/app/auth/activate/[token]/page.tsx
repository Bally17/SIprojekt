"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/lib/axiosClient";

export default function ActivateAccountPage({
  params,
}: {
  readonly params: { readonly token: string };
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Overujem aktivačný odkaz...");

  useEffect(() => {
    const activate = async () => {
      try {
        const token = decodeURIComponent(params.token);
        const res = await axiosClient.get(`/auth/activate/${token}/`);
        setMessage(res.data?.message || "Účet bol úspešne aktivovaný.");
        setStatus("success");
      } catch (error: any) {
        setMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Aktivačný odkaz je neplatný alebo expirovaný.",
        );
        setStatus("error");
      }
    };

    activate();
  }, [params.token]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-primary-900">Aktivácia účtu</h1>
        <p className={status === "error" ? "text-red-600" : "text-gray-700"}>{message}</p>

        {status !== "loading" && (
          <a
            href="/auth/login"
            className="inline-block bg-primary-900 text-white px-4 py-2 rounded hover:bg-primary-800 transition"
          >
            Prejsť na prihlásenie
          </a>
        )}
      </div>
    </main>
  );
}
