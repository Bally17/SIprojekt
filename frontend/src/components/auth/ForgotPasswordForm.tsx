"use client";

import { useState } from "react";
import axiosClient from "@/lib/axiosClient";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await axiosClient.post("/auth/password/reset/", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Požiadavku sa nepodarilo odoslať.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Zabudnuté heslo</h2>
      <p className="text-sm text-gray-600 text-center">
        Zadajte e-mail, ktorým sa prihlasujete. Ak účet existuje, pošleme Vám resetovací odkaz.
      </p>

      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Váš e-mail"
        required
        className="w-full border rounded px-3 py-2"
      />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm text-center">
          Ak účet existuje, poslali sme resetovací odkaz.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
      >
        {loading ? "Odosielam..." : "Poslať resetovací odkaz"}
      </button>
    </form>
  );
}
