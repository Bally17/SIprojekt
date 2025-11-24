"use client";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import axiosClient from "@lib/axiosClient";
import { useState } from "react";
// axiosClient: shared inštancia s baseURL z NEXT_PUBLIC_API_URL (napr. http://localhost:8000/api)

export default function RegisterFormCompany() {
  // Lokálny stav formulára (controlled inputs)
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [loading, setLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  const validateForm = () => {
    if (form.companyName.trim().length < 2) return "Názov firmy musí mať aspoň 2 znaky.";
    if (form.address.trim().length < 5) return "Adresa musí mať aspoň 5 znakov.";
    if (form.contactName.trim().length < 3) return "Meno kontaktnej osoby musí mať aspoň 3 znaky.";
    const phoneDigits = form.contactPhone.replace(/\D/g, "");
    if (phoneDigits.length < 7) return "Telefón musí mať aspoň 7 číslic.";
    return null;
  };

  const getErrorMessage = (err: any) => {
    const data = err?.response?.data;
    if (!data) return msgs.auth.error;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    const parts: string[] = [];
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.join(", ")}`);
      } else if (value) {
        parts.push(`${key}: ${String(value)}`);
      }
    });
    return parts.join(" | ") || msgs.auth.error;
  };

  // Aktualizácia vstupov → state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit handler: mapovanie na backend field names + POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const clientError = validateForm();
    if (clientError) {
      notifyWarning({ title: msgs.auth.errorTitle, description: clientError });
      setLoading(false);
      return;
    }

    // payload presne podľa API
    const payload = {
      email: form.companyEmail,
      nazov: form.companyName,
      adresa: form.address,
      kontaktna_osoba_meno: form.contactName,
      kontaktna_osoba_email: form.contactEmail,
      kontaktna_osoba_telefon: form.contactPhone,
    };

    try {
      // baseURL sa doplní z axiosClient
      const res = await axiosClient.post("/auth/register/company/", payload);
      console.log("✅ Registrácia firmy:", res.data);

      // Reset a info pre používateľa
      notifySuccess({
        title: msgs.auth.successRegister,
        description: msgs.auth.registerCompany,
      });
      setForm({
        companyName: "",
        companyEmail: "",
        address: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    } catch (err: any) {
      const message = getErrorMessage(err);
      console.error("❌ Chyba registrácie:", err);
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
      <h2 className="text-2xl font-semibold text-primary-900 text-center">
        {msgs.auth.registerCompany}
      </h2>

      <input
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        placeholder={msgs.auth.companyName}
        className={input}
        required
      />

      <input
        type="email"
        name="companyEmail"
        value={form.companyEmail}
        onChange={handleChange}
        placeholder={msgs.auth.companyLoginEmail}
        className={input}
        required
      />

      <input
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder={msgs.auth.companyAddress}
        className={input}
        required
      />

      <input
        name="contactName"
        value={form.contactName}
        onChange={handleChange}
        placeholder={msgs.auth.contactName}
        className={input}
        required
      />

      <input
        type="email"
        name="contactEmail"
        value={form.contactEmail}
        onChange={handleChange}
        placeholder={msgs.auth.contactEmail}
        className={input}
        required
      />

      <input
        type="tel"
        name="contactPhone"
        value={form.contactPhone}
        onChange={handleChange}
        placeholder={msgs.auth.contactPhone}
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
        {loading ? msgs.auth.submitting : msgs.auth.registerCompany}
      </Button>
    </form>
  );
}
