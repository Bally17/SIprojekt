"use client";

import { useCallback } from "react";
import Image from "next/image";
import { Button } from "@components/button";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { useAuth } from "@lib/AuthProvider";
import { useForm, type FieldErrors } from "react-hook-form";
import { getErrorMessage } from "@utils/errorActions";
import { input } from "@constants";
import AuthDashboard, { useAuthDashboard } from "@auth/screens/AuthDashboard";
import { RHFInput } from "@components/input";

type LoginFormState = {
  email: string;
  password: string;
};

function LoginFormInner() {
  const { userType, isCompany } = useAuthDashboard();

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
      await login({ role: userType, email: form.email, password: form.password });

      notifySuccess({
        title: msgs.auth.successLogin,
        description: msgs.auth.successLogin,
      });

      reset({ email: form.email, password: "" });
    } catch (err: unknown) {
      notifyWarning({
        title: msgs.auth.errorTitle,
        description: getErrorMessage(err, msgs.auth.errorMsg),
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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login/";
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:8000/auth/github/login/";
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <RHFInput<LoginFormState>
          name="email"
          type="email"
          placeholder={getEmailPlaceholder()}
          className={input}
          register={register}
          errors={errors}
          rules={{ required: msgs.auth.errorMsg }}
        />

        <RHFInput<LoginFormState>
          name="password"
          type="password"
          placeholder={msgs.auth.password}
          className={input}
          register={register}
          errors={errors}
          rules={{ required: msgs.auth.errorMsg }}
        />

        <div className="text-right text-sm">
          <a href="/auth/forgot-password" className="text-ink-500 hover:underline">
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

      {isCompany && (
        <div className="mt-6 space-y-2 text-center">
          <p className="mb-2 text-gray-500">{msgs.auth.orWith}</p>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            variant="ghost"
            className="flex w-full items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200"
          >
            <Image
              unoptimized
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
              unoptimized
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
          <a href="/auth/register/student" className="text-ink-500 hover:underline">
            {msgs.auth.student}
          </a>
          {msgs.auth.or}
          <a href="/auth/register/company" className="text-ink-500 hover:underline">
            {msgs.auth.company}
          </a>
        </p>
      </div>
    </>
  );
}

export default function LoginForm() {
  return (
    <AuthDashboard initialUserType="student">
      <LoginFormInner />
    </AuthDashboard>
  );
}
