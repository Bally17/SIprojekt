"use client";

import { steps } from "@data/howItWorksDatas";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import "@utils/idUsing";

export default function HowItWorks() {
  const { msgs } = useLocalization();

  return (
    <section id="how-it-works" className="bg-primary-600 text-white py-16">
      <div className="container-wide text-center">
        <h2 className="text-3xl font-bold mb-12">
          {msgs.common.page.howItWorks}
          {msgs.common.questionMark}
        </h2>

        <div className="grid md:grid-cols-5 gap-6 relative">
          {steps.map((step, index) => (
            <div
              key={step.title.idUsing()}
              className="relative flex flex-col items-center text-center bg-white/95 rounded-xl text-ink-700 p-6"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm mb-3">
                {index + 1}
              </div>

              <div className="text-primary-600 mb-1">
                <Icon name={step.icon} className="h-6 w-6" />
              </div>

              <div className="font-semibold">{step.title}</div>
              <div className="text-sm text-ink-500 mt-1">{step.text}</div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
