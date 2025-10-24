"use client";
import { useState } from "react";

export default function RegisterFormCompany() {
  const [form, setForm] = useState({
    companyName: "",
    ico: "",
    dic: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactPerson: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Základná validácia
    if (form.password !== form.confirmPassword) {
      alert("Heslá sa nezhodujú");
      return;
    }
    if (!/^\d{8}$/.test(form.ico)) {
      alert("IČO musí mať 8 číslic");
      return;
    }

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
        name="ico"
        value={form.ico}
        onChange={handleChange}
        placeholder="IČO (8 číslic)"
        pattern="\d{8}"
        title="IČO musí mať 8 číslic"
        inputMode="numeric"
        className={input}
        required
      />

      <input
        name="dic"
        value={form.dic}
        onChange={handleChange}
        placeholder="DIČ (voliteľné)"
        autoComplete="off"
        className={input}
      />

      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Firemný email"
        autoComplete="email"
        className={input}
        required
      />

      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Heslo (min. 8 znakov)"
        minLength={8}
        autoComplete="new-password"
        className={input}
        required
      />

      <input
        type="password"
        name="confirmPassword"
        value={form.confirmPassword}
        onChange={handleChange}
        placeholder="Zopakuj heslo"
        minLength={8}
        autoComplete="new-password"
        className={input}
        required
      />

      <input
        name="contactPerson"
        value={form.contactPerson}
        onChange={handleChange}
        placeholder="Kontaktná osoba"
        autoComplete="name"
        className={input}
      />

      <button
        type="submit"
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800"
      >
        Registrovať firmu
      </button>
    </form>
  );
}
