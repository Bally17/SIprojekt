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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Student registration:", form);
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Registrácia študenta</h2>

      <input
        name="firstName"
        placeholder="Meno"
        onChange={handleChange}
        className={input}
        required
      />

      <input
        name="lastName"
        placeholder="Priezvisko"
        onChange={handleChange}
        className={input}
        required
      />

      <input
        name="address"
        placeholder="Adresa"
        onChange={handleChange}
        className={input}
        required
      />

      <input
        type="email"
        name="studentEmail"
        placeholder="Študentský e-mail"
        onChange={handleChange}
        className={input}
        required
      />

      <input
        type="email"
        name="altEmail"
        placeholder="Alternatívny e-mail (voliteľný)"
        onChange={handleChange}
        className={input}
      />

      <input
        type="tel"
        name="phone"
        placeholder="Telefón"
        onChange={handleChange}
        className={input}
        required
      />

      <input
        name="studyField"
        placeholder="Študijný odbor"
        onChange={handleChange}
        className={input}
        required
      />

      <button
        type="submit"
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800"
      >
        Registrovať ako študent
      </button>
    </form>
  );
}
