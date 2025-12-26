"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useAuth } from "src/lib/AuthProvider";
import { RoleType } from "@shared-types/core/common";
import { useForm, type FieldErrors } from "react-hook-form";
import { getErrorMessage } from "@utils/errorActions";

type LoginFormState = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const [userType, setUserType] = useState<RoleType>("student");
  const isStudent = userType === "student";
  const isCompany = userType === "company";
  const isGarant = userType === "garant";

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();
  const { login, loginLoading } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormState>({
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const getEmailPlaceholder = useCallback(() => {
    if (userType === "student") return msgs.auth.studentEmail;
    if (userType === "company") return msgs.auth.companyEmail;
    return msgs.auth.guarantEmail;
  }, [userType, msgs.auth.studentEmail, msgs.auth.companyEmail, msgs.auth.guarantEmail]);

  const onSubmit = async (form: LoginFormState) => {
    try {
      await login({
        role: userType,
        email: form.email,
        password: form.password,
      });

      notifySuccess({
        title: msgs.auth.successLogin,
        description: msgs.auth.successLogin,
      });

      reset({ email: form.email, password: "" });
    } catch (err: unknown) {
      // preferuj centrálny handler; ak chceš zachovať "errorMsg" ako fallback, dá sa:
      const message = getErrorMessage(err, msgs.auth.errorMsg);

      console.error(msgs.auth.errorTitle, err);

      console.error(msgs.auth.errorTitle, (err as any)?.response?.data || (err as any)?.message);

      notifyWarning({
        title: msgs.auth.errorTitle,
        description: message,
      });
    }
  };

  const onInvalid = (errs: FieldErrors<LoginFormState>) => {
    const firstMessage =
      Object.values(errs)
        .map((e) => e?.message)
        .find((m): m is string => typeof m === "string" && m.length > 0) ?? msgs.auth.errorMsg;

    notifyWarning({ title: msgs.auth.errorTitle, description: firstMessage });
  };

  // OAuth len pre firmy
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login/";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:8000/auth/github/login/";
  };

  const input = "w-full border rounded px-3 py-2";
  const errorText = "text-sm text-red-600";

  return (
    <div className="bg-white shadow-md rounded-lg p-6 space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-primary-900 text-center">{msgs.auth.title}</h2>

      {/* Prepínač typu používateľa */}
      <div className="mb-4 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          onClick={() => setUserType("student")}
          variant={isStudent ? "primary" : "ghost"}
          className={`rounded-full px-4 py-2 text-sm ${
            isStudent ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-pressed={isStudent}
        >
          {msgs.common.entities.student}
        </Button>

        <Button
          type="button"
          onClick={() => setUserType("company")}
          variant={isCompany ? "primary" : "ghost"}
          className={`rounded-full px-4 py-2 text-sm ${
            isCompany ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-pressed={isCompany}
        >
          {msgs.common.entities.company}
        </Button>

        <Button
          type="button"
          onClick={() => setUserType("garant")}
          variant={isGarant ? "primary" : "ghost"}
          className={`rounded-full px-4 py-2 text-sm ${
            isGarant ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-pressed={isGarant}
        >
          {msgs.common.entities.guarant}
        </Button>
      </div>

      {/* Login formulár */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder={getEmailPlaceholder()}
            className={input}
            {...register("email", { required: msgs.auth.errorMsg })}
          />
          {errors.email?.message && <p className={errorText}>{errors.email.message}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder={msgs.auth.password}
            className={input}
            {...register("password", { required: msgs.auth.errorMsg })}
          />
          {errors.password?.message && <p className={errorText}>{errors.password.message}</p>}
        </div>

        <div className="text-right text-sm">
          <a href="/auth/forgot-password" className="text-cyan-700 hover:underline">
            {msgs.auth.forgot}
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loginLoading}
          loading={loginLoading}
        >
          {loginLoading ? msgs.auth.logining : msgs.auth.login}
        </Button>
      </form>

      {/* OAuth blok – len pre firmy */}
      {userType === "company" && (
        <div className="mt-6 space-y-2 text-center">
          <p className="mb-2 text-gray-500">{msgs.auth.orWith}</p>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
              width={20}
              height={20}
            />
            {msgs.auth.google}
          </Button>

          <Button
            type="button"
            onClick={handleGithubLogin}
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
          >
            <Image
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="h-5 w-5"
              width={20}
              height={20}
            />
            {msgs.auth.github}
          </Button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-600">
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
