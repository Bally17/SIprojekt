"use client";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import axiosClient from "@lib/axiosClient";
import { useState } from "react";
// axiosClient = centrálna inštancia s baseURL (NEXT_PUBLIC_API_URL)

export default function RegisterFormStudent() {
  // Lokálny stav formulára
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    studentEmail: "",
    altEmail: "",
    phone: "",
    studyField: "",
  });

  // Stav UI (spinner + hlášky)
  const [loading, setLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // Aktualizácia vstupov → state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit handler: mapovanie na backend field names + POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      meno: form.firstName,
      priezvisko: form.lastName,
      adresa: form.address,
      email: form.studentEmail,
      alt_email: form.altEmail || "",
      telefon: form.phone,
      studijny_program: form.studyField,
    };

    console.log("📤 Payload odosielaný na backend:", payload);

    try {
      // baseURL sa doplní z axiosClient
      const res = await axiosClient.post("/auth/register/student/", payload);
      console.log("✅ Registrácia študenta:", res.data);

      notifySuccess({
        title: msgs.auth.successRegister,
        description: msgs.auth.registerStudent,
      });
      setForm({
        firstName: "",
        lastName: "",
        address: "",
        studentEmail: "",
        altEmail: "",
        phone: "",
        studyField: "",
      });
    } catch (err: any) {
      const message = err.response?.data?.message || msgs.auth.errorSubmit;
      console.error("❌ Chyba pri registrácii:", err.response?.data || err);
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: message,
      });
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
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">
        {msgs.auth.registerStudent}
      </h2>

      {/* Polia formulára */}
      <input
        name="firstName"
        placeholder={msgs.auth.name}
        onChange={handleChange}
        value={form.firstName}
        className={input}
        required
      />
      <input
        name="lastName"
        placeholder={msgs.auth.surename}
        onChange={handleChange}
        value={form.lastName}
        className={input}
        required
      />
      <input
        name="address"
        placeholder={msgs.auth.address}
        onChange={handleChange}
        value={form.address}
        className={input}
        required
      />
      <input
        type="email"
        name="studentEmail"
        placeholder={msgs.auth.email}
        onChange={handleChange}
        value={form.studentEmail}
        className={input}
        required
      />
      <input
        type="email"
        name="altEmail"
        placeholder={msgs.auth.altEmail}
        onChange={handleChange}
        value={form.altEmail}
        className={input}
      />
      <input
        type="tel"
        name="phone"
        placeholder={msgs.auth.phone}
        onChange={handleChange}
        value={form.phone}
        className={input}
        required
      />
      <input
        name="studyField"
        placeholder={msgs.auth.studyField}
        onChange={handleChange}
        value={form.studyField}
        className={input}
        required
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
        loading={loading}
        aria-busy={loading}
      >
        {loading ? msgs.auth.submitting : msgs.auth.registerStudent}
      </Button>
    </form>
  );
}
