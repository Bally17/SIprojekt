import { ResetPasswordForm } from "@features/auth";

export default function ResetPasswordPage({
  params,
}: {
  readonly params: { readonly token: string };
}) {
  const decodedToken = decodeURIComponent(params.token);

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-6">
      <ResetPasswordForm token={decodedToken} />
    </div>
  );
}
