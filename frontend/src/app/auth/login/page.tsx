import LoginForm from "@/features/auth/components/LoginForm";
import { BackButton } from "@features/auth";
import { Footer, Navbar } from "@features/landing";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <BackButton
            className={
              "`group inline-flex items-center gap-2 rounded-lg border border-primary-100 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900 shadow-soft transition-all hover:-translate-x-0.5 hover:border-primary-200 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${className}`.trim()"
            }
          />
        </div>
        <div className="mt-12 flex items-center justify-center px-6">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
