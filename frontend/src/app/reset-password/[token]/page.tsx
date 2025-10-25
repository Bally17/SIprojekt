import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

// Stránka pre reset hesla – zobrazuje formulár s tokenom z URL
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <ResetPasswordForm token={decodeURIComponent(resolvedParams.token)} />
    </div>
  );
}
