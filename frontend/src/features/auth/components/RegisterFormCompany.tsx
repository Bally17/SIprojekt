"use client";
import { useState } from "react";
// axiosClient: shared inštancia s baseURL z NEXT_PUBLIC_API_URL (napr. http://localhost:8000/api)
import axiosClient from "@/lib/axiosClient";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Aktualizácia vstupov → state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit handler: mapovanie na backend field names + POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

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
      setSuccess(true);
      setForm({
        companyName: "",
        companyEmail: "",
        address: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    } catch (err: any) {
      console.error("❌ Chyba registrácie:", err);
      setError(
        err.response?.data?.message ||
          "Nepodarilo sa odoslať formulár. Skontrolujte údaje a skúste znova.",
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
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Registrácia firmy</h2>

      <input
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        placeholder="Názov spoločnosti"
        className={input}
        required
      />

      <input
        type="email"
        name="companyEmail"
        value={form.companyEmail}
        onChange={handleChange}
        placeholder="Firemný prihlasovací e-mail"
        className={input}
        required
      />

      <input
        name="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Adresa spoločnosti"
        className={input}
        required
      />

      <input
        name="contactName"
        value={form.contactName}
        onChange={handleChange}
        placeholder="Kontaktná osoba – meno"
        className={input}
        required
      />

      <input
        type="email"
        name="contactEmail"
        value={form.contactEmail}
        onChange={handleChange}
        placeholder="Kontaktná osoba – e-mail"
        className={input}
        required
      />

      <input
        type="tel"
        name="contactPhone"
        value={form.contactPhone}
        onChange={handleChange}
        placeholder="Kontaktná osoba – telefón"
        className={input}
        required
      />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 text-sm text-center">✅ Registrácia úspešná!</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
      >
        {loading ? "Odosielam..." : "Registrovať ako firma"}
      </button>
    </form>
  );
}
