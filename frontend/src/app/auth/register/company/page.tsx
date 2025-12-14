import { BackButton, RegisterFormCompany } from "@features/auth";
import { Footer, Navbar } from "@features/landing";

export default function RegisterCompanyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-primary-50">
      <Navbar showLandingLinks={false} />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <BackButton />
        </div>
        <div className="mt-12 flex items-center justify-center px-6">
          <RegisterFormCompany />
        </div>
      </main>
      <Footer showLandingLinks={false} />
    </div>
  );
}
