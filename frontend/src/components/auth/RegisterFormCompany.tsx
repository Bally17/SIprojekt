"use client";
import { useState } from "react";

export default function RegisterFormCompany() {
  const [form, setForm] = useState({
    companyName: "",
    address: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Company registration:", form);
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
        autoComplete="organization"
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

      <button
        type="submit"
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800"
      >
        Registrovať ako firma
      </button>
    </form>
  );
}
