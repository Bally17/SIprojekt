import RegisterFormStudent from "@/features/auth/components/RegisterFormStudent";
import { BackButton } from "@features/auth";
import { Footer, Navbar } from "@features/landing";

export default function RegisterStudentPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <BackButton />
        </div>
        <div className="mt-12 flex items-center justify-center px-6">
          <RegisterFormStudent />
        </div>
      </main>
      <Footer />
    </div>
  );
}
