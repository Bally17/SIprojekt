"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// axiosClient má baseURL z NEXT_PUBLIC_API_URL
import axiosClient, { setAuthTokens } from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { useSystemNotifications } from "@/shared/components/notifications";
import { Button } from "@/shared/components/button";
import { RoleType } from "@/shared/types/components/button/RoleTypes";

export default function LoginForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<RoleType>("student");
  const isStudent = userType === "student";
  const isCompany = userType === "company";

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

  // Odoslanie loginu - študenti vs firmy
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        password: form.password,
      };

      const endpoint = isStudent ? "/auth/login/" : "/auth/login/company/";
      const res = await axiosClient.post(endpoint, payload);

      console.log("Login úspešný:", res.data);

      // Uloženie tokenov
      const accessToken = res.data.access_token || res.data.tokens?.access;
      const refreshToken = res.data.refresh_token || res.data.tokens?.refresh;
      if (accessToken) {
        setAuthTokens({ access: accessToken, refresh: refreshToken });
      }

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
        err.response?.data?.error_description ||
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.message ||
        msgs.auth.errorMsg;
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
        <Button
          type="button"
          onClick={() => setUserType("student")}
          variant={isStudent ? "primary" : "ghost"}
          className={`rounded-full px-4 py-2 text-sm ${isStudent ? "" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"}`}
          aria-pressed={isStudent}
        >
          {msgs.common.entities.student}
        </Button>

        <Button
          type="button"
          onClick={() => setUserType("company")}
          variant={isCompany ? "primary" : "ghost"}
          className={`rounded-full px-4 py-2 text-sm ${isCompany ? "" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0"}`}
          aria-pressed={isCompany}
        >
          {msgs.common.entities.company}
        </Button>
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

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading}
          loading={loading}
        >
          {loading ? msgs.auth.logining : msgs.auth.login}
        </Button>
      </form>

      {/* OAuth blok – zobraziť len pre firmy */}
      {userType === "company" && (
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-500 mb-2">{msgs.auth.orWith}</p>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
              width={20}
              height={20}
            />
            {msgs.auth.google}
          </Button>

          <Button
            type="button"
            onClick={handleGithubLogin}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
          >
            <Image
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-5 h-5"
              width={20}
              height={20}
            />
            {msgs.auth.github}
          </Button>
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
