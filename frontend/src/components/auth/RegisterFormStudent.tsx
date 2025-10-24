"use client";
import { useState } from "react";

export default function RegisterFormStudent() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    studentEmail: "",
    altEmail: "",
    phone: "",
    studyField: "",
  });

  // Stavové premené pre načítanie, chybu a úspech
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Aktualizácia poľa pri zmene hodnoty
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Odoslanie dát na backend (fetch POST request)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/register/student/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Registrácia zlyhala");

      const data = await response.json();
      console.log("✅ Registrácia študenta:", data);

      // Reset formulára po úspechu
      setSuccess(true);
      setForm({
        firstName: "",
        lastName: "",
        address: "",
        studentEmail: "",
        altEmail: "",
        phone: "",
        studyField: "",
      });
    } catch (err) {
      // Zobrazenie chybovej hlášky
      console.error(err);
      setError("Nepodarilo sa odoslať formulár. Skontrolujte údaje a skúste znova.");
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
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Registrácia študenta</h2>

      {/* Polia formulára */}
      <input
        name="firstName"
        placeholder="Meno"
        onChange={handleChange}
        value={form.firstName}
        className={input}
        required
      />

      <input
        name="lastName"
        placeholder="Priezvisko"
        onChange={handleChange}
        value={form.lastName}
        className={input}
        required
      />

      <input
        name="address"
        placeholder="Adresa"
        onChange={handleChange}
        value={form.address}
        className={input}
        required
      />

      <input
        type="email"
        name="studentEmail"
        placeholder="Študentský e-mail"
        onChange={handleChange}
        value={form.studentEmail}
        className={input}
        required
      />

      <input
        type="email"
        name="altEmail"
        placeholder="Alternatívny e-mail (voliteľný)"
        onChange={handleChange}
        value={form.altEmail}
        className={input}
      />

      <input
        type="tel"
        name="phone"
        placeholder="Telefón"
        onChange={handleChange}
        value={form.phone}
        className={input}
        required
      />

      <input
        name="studyField"
        placeholder="Študijný odbor"
        onChange={handleChange}
        value={form.studyField}
        className={input}
        required
      />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {success && <p className="text-green-600 text-sm text-center">✅ Registrácia úspešná!</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
      >
        {loading ? "Odosielam..." : "Registrovať ako študent"}
      </button>
    </form>
  );
}
