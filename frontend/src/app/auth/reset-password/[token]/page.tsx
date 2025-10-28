import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage({
  params,
}: {
  readonly params: { readonly token: string };
}) {
  const decodedToken = decodeURIComponent(params.token);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <ResetPasswordForm token={decodedToken} />
    </div>
  );
}
