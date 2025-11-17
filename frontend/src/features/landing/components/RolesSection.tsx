"use client";
import Image from "next/image";
import { roleSectionDatas, rolePreviewImages } from "@/shared/data/roleSectionDatas";
import { useLocalization } from "@/shared/i18n/client";
import { useState } from "react";
import "@utils/idUsing";
import Icon from "@/shared/icons";
import { Button } from "@/shared/components/button";
import { RoleType } from "@/shared/types/roleTypes";

export default function RolesSection() {
  const { msgs } = useLocalization();
  const [tab, setTab] = useState<RoleType>("student");

  // kľúče sú v súlade s RoleType; label môže ostať "Firma"
  const tabs: { key: RoleType; label: string; icon: React.ReactNode }[] = [
    { key: "student", label: "Študent", icon: <Icon name="graduation-cap" className="h-4 w-4" /> },
    { key: "firma", label: "Firma", icon: <Icon name="building-2" className="h-4 w-4" /> },
    { key: "garant", label: "Garant", icon: <Icon name="shield" className="h-4 w-4" /> },
  ];

  const isActive = (k: RoleType) => tab === k;

  return (
    <section id="roles" className="section">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">{msgs.common.role.title}</h2>
        <p className="text-ink-500 mb-6">{msgs.common.role.subtitle}</p>

        <div className="grid md:grid-cols-[220px,1fr] gap-5">
          {/* ľavý zoznam tabov */}
          <div className="card p-0" role="tablist" aria-orientation="vertical">
            {tabs.map((t) => (
              <Button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                variant={isActive(t.key) ? "soft" : "ghost"}
                role="tab"
                aria-selected={isActive(t.key)}
                className={`w-full justify-start px-4 py-3 border-b last:border-b-0 text-left ${
                  isActive(t.key)
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "hover:bg-slate-50"
                }`}
              >
                <span className="h-6 w-6 grid place-items-center rounded-full bg-slate-100">
                  {t.icon}
                </span>
                {t.label}
              </Button>
            ))}
            <div className="px-4 py-3 text-xs text-slate-500">{msgs.common.role.note}</div>
          </div>

          {/* pravý panel */}
          <div className="card">
            {/* horné toggle pilule */}
            <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-orientation="horizontal">
              {tabs.map((t) => (
                <Button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  variant={isActive(t.key) ? "primary" : "ghost"}
                  role="tab"
                  aria-selected={isActive(t.key)}
                  className={`rounded-lg px-3 py-2 text-sm border ${
                    isActive(t.key)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </Button>
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
