"use client";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-16 bg-gray-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
        <div className="max-w-lg space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 leading-tight">
            Praxy, správa odbornej praxe jednoducho...
          </h1>
          <p className="text-gray-600">
            CRM systém pre študentov, firmy a garantov. Správa praxí, dokumentov a stavov – bez papierovačiek.
          </p>

          <div className="flex justify-center md:justify-start gap-4">
            <button className="bg-blue-900 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-800 transition">
              Registrácia firmy
            </button>
            <button className="border border-blue-900 px-6 py-3 rounded-md text-blue-900 hover:bg-blue-50 transition">
              Registrácia študenta
            </button>
          </div>
        </div>

        <div className="mt-10 md:mt-0">
          <Image
            src="/images/landingPict.png"
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
