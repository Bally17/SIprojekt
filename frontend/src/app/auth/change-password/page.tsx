"use client";

import { ChangePasswordForm } from "@features/auth";
import { Footer, Navbar } from "@features/landing";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar showLandingLinks={false} />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <ChangePasswordForm />
        </div>
      </main>
      <Footer showLandingLinks={false} />
    </div>
  );
}
