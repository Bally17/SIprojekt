"use client";

import { ChangePasswordForm } from "@auth/_components";
import { Footer } from "@components/footer";
import { Header } from "@components/header";

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header showLandingLinks={false} />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <ChangePasswordForm />
        </div>
      </main>
      <Footer showLandingLinks={false} />
    </div>
  );
}
