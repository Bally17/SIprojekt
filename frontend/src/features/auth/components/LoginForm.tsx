"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// axiosClient má baseURL z NEXT_PUBLIC_API_URL
import axiosClient from "@/lib/axiosClient";

export default function LoginForm() {
  const router = useRouter();
  // Prepínač medzi „študent“ a firma
  const [userType, setUserType] = useState<"student" | "company">("student");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Sync vstupov do state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Odoslanie loginu – jednotný endpoint /auth/login/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const endpoint = "/auth/login/";
      const res = await axiosClient.post(endpoint, form);

      console.log("Login úspešný:", res.data);

      // Uloženie tokenov
      const { access, refresh } = res.data.tokens;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Uloženie používateľa na localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess(true);

      // Redirect podľa roly
      if (res.data.user.rola === "firma") {
        router.push("/dashboard/company/internships");
      } else {
        router.push("/dashboard/student/dashboard");
      }
    } catch (err: any) {
      console.error("Chyba pri prihlásení:", err.response?.data || err.message);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Prihlásenie zlyhalo, skontrolujte email a heslo.",
      );
    } finally {
      setLoading(false);
    }
  };

  // OAuth len pre firmy (študenti cez školský login/heslo)
  const handleGoogleLogin = () => {
    // Pozn: (redirect na backend)
    window.location.href = "http://localhost:8000/auth/google/login/";
  };
  const handleGithubLogin = () => {
    window.location.href = "http://localhost:8000/auth/github/login/";
  };

  const input = "w-full border rounded px-3 py-2";

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">Prihlásenie</h2>

      {/* Prepínač typu používateľa – ovplyvňuje len placeholder a zobrazenie OAuth blokov */}
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

      {/* Login formulár – jednotný pre oba typy (payload email + password) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder={userType === "student" ? "Študentský e-mail" : "Firemný e-mail"}
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

        <div className="text-right text-sm">
          <a href="/auth/forgot-password" className="text-cyan-700 hover:underline">
            Zabudli ste heslo?
          </a>
        </div>

        {/* Stavové hlášky */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">✅ Prihlásenie úspešné!</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
        >
          {loading ? "Prihlasujem..." : "Prihlásiť sa"}
        </button>
      </form>

      {/* OAuth blok – zobraziť len pre firmy */}
      {userType === "company" && (
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
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        <p>
          Nemáte účet? Registrácia{" "}
          <a href="/auth/register/student" className="text-cyan-700 hover:underline">
            študenta
          </a>{" "}
          alebo{" "}
          <a href="/auth/register/company" className="text-cyan-700 hover:underline">
            firmy
          </a>
        </p>
      </div>
    </div>
  );
}
