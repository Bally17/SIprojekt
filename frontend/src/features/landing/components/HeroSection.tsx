"use client";
import { useLocalization } from "@i18n/client";
import Image from "next/image";

export default function HeroSection() {
  const { msgs } = useLocalization();
  return (
    <section className="pt-32 pb-16 bg-primary-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
        <div className="max-w-lg space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-ink-900 leading-tight">
            {msgs.common.hero.title}
          </h1>

          <p className="text-ink-500">{msgs.common.hero.subtitle}</p>

          <div className="flex justify-center md:justify-start gap-4">
            <a
              href="/auth/register/company"
              className="bg-primary-700 text-white px-6 py-3 rounded-md shadow-md hover:bg-primary-500 transition"
            >
              {msgs.auth.registerCompany}
            </a>
            <a
              href="/auth/register/student"
              className="border border-primary-700 px-6 py-3 rounded-md text-primary-900 hover:bg-primary-100 transition"
            >
              {msgs.auth.registerStudent}
            </a>
          </div>
        </div>

        <div className="mt-10 md:mt-0">
          <Image
            src="/images/hero1.jpg"
            alt="Hero"
            width={500}
            height={400}
            className="rounded-xl shadow-lg hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  );
}
