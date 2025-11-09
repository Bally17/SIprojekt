"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// axiosClient má baseURL z NEXT_PUBLIC_API_URL
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";

export default function LoginForm() {
  const router = useRouter();
  // Prepínač medzi „študent“ a firma
  const [userType, setUserType] = useState<"student" | "company">("student");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // Sync vstupov do state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Odoslanie loginu – jednotný endpoint /auth/login/
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      notifySuccess({
        title: msgs.auth.successLogin,
        description: msgs.auth.successLogin,
      });

      // Redirect podľa roly
      if (res.data.user.rola === "firma") {
        router.push("/dashboard/company");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || msgs.auth.errorMsg;
      console.error(msgs.auth.errorTitle, err.response?.data || err.message);
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: message,
      });
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
      <h2 className="text-2xl font-semibold text-cyan-700 text-center">{msgs.auth.title}</h2>

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
          {msgs.common.entities.student}
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
          {msgs.common.entities.company}
        </button>
      </div>

      {/* Login formulár – jednotný pre oba typy (payload email + password) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder={userType === "student" ? msgs.auth.studentEmail : msgs.auth.companyEmail}
          value={form.email}
          onChange={handleChange}
          className={input}
          required
        />

        <input
          type="password"
          name="password"
          placeholder={msgs.auth.password}
          value={form.password}
          onChange={handleChange}
          className={input}
          required
        />

        <div className="text-right text-sm">
          <a href="/auth/forgot-password" className="text-cyan-700 hover:underline">
            {msgs.auth.forgot}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-700 text-white py-2 rounded hover:bg-cyan-800 disabled:opacity-70"
        >
          {loading ? msgs.auth.logining : msgs.auth.login}
        </button>
      </form>

      {/* OAuth blok – zobraziť len pre firmy */}
      {userType === "company" && (
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 mb-2">{msgs.auth.orWith}</p>

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
            {msgs.auth.google}
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
            {msgs.auth.github}
          </button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        <p>
          {msgs.auth.noAccount}
          <a href="/auth/register/student" className="text-cyan-700 hover:underline">
            {msgs.auth.student}
          </a>
          {msgs.auth.or}
          <a href="/auth/register/company" className="text-cyan-700 hover:underline">
            {msgs.auth.company}
          </a>
        </p>
      </div>
    </div>
  );
}
