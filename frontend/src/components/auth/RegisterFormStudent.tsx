"use client";
import { useState } from "react";

export default function RegisterFormStudent() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Student registration:", form);
  };

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
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        name="lastName"
        placeholder="Priezvisko"
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Študentský email"
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Heslo"
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        name="confirmPassword"
        placeholder="Zopakuj heslo"
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        name="university"
        placeholder="Univerzita"
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />

      <button
        type="submit"
        className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800"
      >
        Registrovať sa
      </button>
    </form>
  );
}
