"use client";

import { CompanyProfileCompleteNotice } from "@auth/_components";
import { Footer } from "@components/footer";
import { Header } from "@components/header";

export default function CompanyCompleteInfoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header showLandingLinks={false} />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <CompanyProfileCompleteNotice />
        </div>
      </main>
      <Footer showLandingLinks={false} />
    </div>
  );
}
