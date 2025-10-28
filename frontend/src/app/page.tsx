import {
  Navbar,
  HeroSection,
  HowItWorks,
  Features,
  RolesSection,
  FAQSection,
  Footer,
} from "@features/landing";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-gray-50 scroll-smooth">
      {/* ✅ Fixnutý navbar so správnym spacingom */}
      <Navbar />

      {/* ✅ Posun obsahu pod fixed header */}
      {/* <div className="pt-24 space-y-32"> */}
      <HeroSection />
      <HowItWorks />
      <Features />
      <RolesSection />
      <FAQSection />
      <Footer />
      {/* </div> */}
    </main>
  );
}
