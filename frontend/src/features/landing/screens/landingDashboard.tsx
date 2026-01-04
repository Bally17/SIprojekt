import React from "react";
import { FAQSection, Features, HeroSection, HowItWorks, RolesSection } from "../_components";
import { Footer } from "@components/footer";
import { Header } from "@components/header";

const landingDashboard = () => {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50 scroll-smooth">
      <Header />
      <HeroSection />
      <HowItWorks />
      <Features />
      <RolesSection />
      <FAQSection />
      <Footer />
    </main>
  );
};

export default landingDashboard;
