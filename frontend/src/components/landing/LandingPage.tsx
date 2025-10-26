import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import RolesSection from "@/components/landing/RolesSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";

export default function HomePage() {
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
