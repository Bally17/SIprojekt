import { ResetPasswordForm } from "@auth/_components";

export default function ResetPasswordPage({
  params,
}: {
  readonly params: { readonly token: string };
}) {
  const decodedToken = decodeURIComponent(params.token);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <ResetPasswordForm token={decodedToken} />
    </div>
  );
}
