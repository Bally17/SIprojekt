"use client";
import Image from "next/image";
import { useState } from "react";
import "@utils/idUsing";
import { roleSectionDatas, rolePreviewImages, tabs } from "@data/roleSectionDatas";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import { RoleType } from "@type/props/common/globalTypes";

export default function RolesSection() {
  const { msgs } = useLocalization();
  const [tab, setTab] = useState<RoleType>("student");

  return (
    <section id="roles" className="section bg-primary-50">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">{msgs.common.role.title}</h2>
        <p className="text-ink-500 mb-6">{msgs.common.role.subtitle}</p>

        <div className="grid md:grid-cols-[220px,1fr] gap-5">
          <div className="card p-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b last:border-b-0 ${tab === t.key ? "bg-primary-50 text-primary-700 font-medium" : "hover:bg-slate-50"}`}
              >
                <span className="h-6 w-6 grid place-items-center rounded-full bg-slate-100">
                  <Icon name={t.icon} className="h-4 w-4" />
                </span>
                {t.label}
              </button>
            ))}
            <div className="px-4 py-3 text-xs text-slate-500">{msgs.common.role.note}</div>
          </div>

          <div className="card">
            <div className="flex flex-wrap gap-2 mb-4">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-2 rounded-lg border text-sm ${tab === t.key ? "bg-primary-600 text-white border-primary-600" : "hover:bg-slate-50"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-2">{msgs.common.role.permissions}</div>
                <ul className="space-y-2">
                  {roleSectionDatas[tab].map((r) => (
                    <li key={r.a.idUsing()} className="flex items-start gap-2">
                      <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 text-primary-600" />
                      <span>{r.a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">{msgs.common.role.previewTitle}</div>
                <div className="rounded-xl border bg-white p-4">
                  <Image
                    src={rolePreviewImages[tab]}
                    alt={`${tabs.find((t) => t.key === tab)?.label} dashboard preview`}
                    width={960}
                    height={600}
                    className="w-full rounded-lg border border-slate-100 shadow-soft"
                    priority={tab === "student"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
