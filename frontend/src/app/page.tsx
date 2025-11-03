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
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Features />
      <RolesSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
