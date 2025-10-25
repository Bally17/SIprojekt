"use client";

import { useState } from "react";
import axiosClient from "@/lib/axiosClient";

type Props = {
  token: string;
};

export default function ResetPasswordForm({ token }: Props) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Ukladá zmeny z inputov podľa ich name atribútu

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // Po odoslaní formu volá API POST, a pošle token a passwordy.

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await axiosClient.post("/auth/password/reset/confirm/", {
        token,
        new_password: form.newPassword,
        new_password_confirm: form.confirmPassword,
      });
      setSuccess(true);
      setForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Nepodarilo sa nastaviť nové heslo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Nastaviť nové heslo</h2>

      <input
        type="password"
        name="newPassword"
        placeholder="Nové heslo"
        value={form.newPassword}
        onChange={handleChange}
        className={input}
        required
        minLength={8}
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Potvrdiť heslo"
        value={form.confirmPassword}
        onChange={handleChange}
        className={input}
        required
        minLength={8}
      />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {success && (
        <p className="text-green-600 text-sm text-center">
          Heslo bolo zmenené. Môžete sa prihlásiť.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
      >
        {loading ? "Ukladám..." : "Uložiť nové heslo"}
      </button>
    </form>
  );
}
