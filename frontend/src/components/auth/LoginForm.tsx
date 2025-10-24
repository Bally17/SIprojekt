"use client";
import { useState } from "react";
import Image from "next/image";

export default function LoginForm() {
  // Typ používateľa (študent / firma)
  const [userType, setUserType] = useState<"student" | "company">("student");

  // Údaje z formulára
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Stav aplikácie (načítavanie, chyba)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Zmena hodnôt inputov
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Odoslanie formulára na backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        userType === "student"
          ? "http://localhost:8000/api/login/student/"
          : "http://localhost:8000/api/login/company/";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Neplatné prihlasovacie údaje");
      const data = await response.json();

      console.log("Login successful:", data);
      alert("Úspešné prihlásenie!");
    } catch (err) {
      console.error(err);
      setError("Prihlásenie zlyhalo, skontrolujte email a heslo.");
    } finally {
      setLoading(false);
    }
  };

  // OAuth loginy
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login/";
  };
  const handleGithubLogin = () => {
    window.location.href = "http://localhost:8000/auth/github/login/";
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Prihlásenie</h2>

      {/* Prepínač typu používateľa */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => setUserType("student")}
          className={`px-4 py-2 rounded-full text-sm ${
            userType === "student"
              ? "bg-cyan-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Študent
        </button>
        <button
          type="button"
          onClick={() => setUserType("company")}
          className={`px-4 py-2 rounded-full text-sm ${
            userType === "company"
              ? "bg-cyan-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Firma
        </button>
      </div>

      {/* Login pre študenta */}
      {userType === "student" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Študentský email"
            value={form.email}
            onChange={handleChange}
            className={input}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Heslo"
            value={form.password}
            onChange={handleChange}
            className={input}
            required
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
          >
            {loading ? "Prihlasujem..." : "Prihlásiť sa"}
          </button>
        </form>
      )}

      {/* Login pre firmu */}
      {userType === "company" && (
        <div className="space-y-4">
          {/* Klasické prihlasenie */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Firemný email"
              value={form.email}
              onChange={handleChange}
              className={input}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Heslo"
              value={form.password}
              onChange={handleChange}
              className={input}
              required
            />

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
            >
              {loading ? "Prihlasujem..." : "Prihlásiť sa"}
            </button>
          </form>

          {/* OAuth sekcia */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-500 mb-2">alebo prihlásenie cez:</p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="bg-gray-100 border px-3 py-2 rounded w-full hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
                width={20}
                height={20}
              />
              Pokračovať cez Google
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="bg-gray-100 border px-3 py-2 rounded w-full hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Image
                src="https://www.svgrepo.com/show/512317/github-142.svg"
                alt="GitHub"
                className="w-5 h-5"
                width={20}
                height={20}
              />
              Pokračovať cez GitHub
            </button>
          </div>
        </div>
      )}

      {/* Odkazy na registráciu */}
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>
          Nemáte účet?{" "}
          <a href="/register/student" className="text-cyan-700 hover:underline">
            Registrácia študenta
          </a>{" "}
          alebo{" "}
          <a href="/register/company" className="text-cyan-700 hover:underline">
            firmy
          </a>
        </p>
      </div>
    </div>
  );
}
