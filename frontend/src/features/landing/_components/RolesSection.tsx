"use client";
import Image from "next/image";
import { useState } from "react";
import "@utils/idUsing";
import { rolePreviewImagesByLocale } from "@data/roleSectionDatas";
import { useLocalization } from "@i18n/client";
import Icon from "@icons/index";
import type IconName from "@icons/iconName";
import { RoleType } from "@shared-types/core/common";

export default function RolesSection() {
  const { msgs, locale } = useLocalization();
  const [tab, setTab] = useState<RoleType>("student");
  const roleImages = rolePreviewImagesByLocale[locale] ?? rolePreviewImagesByLocale.sk;

  // vyberáme preklady jednotlivých oprávnení každý kľúč samostatne kvôli i18n
  const studentPerms: string[] = [
    msgs.common.rolesSection.studentPerm1,
    msgs.common.rolesSection.studentPerm2,
    msgs.common.rolesSection.studentPerm3,
    msgs.common.rolesSection.studentPerm4,
  ].filter(Boolean);
  const companyPerms: string[] = [
    msgs.common.rolesSection.companyPerm1,
    msgs.common.rolesSection.companyPerm2,
    msgs.common.rolesSection.companyPerm3,
    msgs.common.rolesSection.companyPerm4,
  ].filter(Boolean);
  const garantPerms: string[] = [
    msgs.common.rolesSection.garantPerm1,
    msgs.common.rolesSection.garantPerm2,
    msgs.common.rolesSection.garantPerm3,
    msgs.common.rolesSection.garantPerm4,
  ].filter(Boolean);

  // Tab labely berieme z i18n; ak chýbajú, nechávame prázdne pole
  type TabDef = { key: RoleType; label: string; icon: IconName };
  const tabs: TabDef[] = [
    { key: "student", label: msgs.common?.rolesSection?.tabStudent, icon: "graduation-cap" },
    { key: "company", label: msgs.common?.rolesSection?.tabCompany, icon: "building-2" },
    { key: "garant", label: msgs.common?.rolesSection?.tabGarant, icon: "shield" },
  ].filter((t): t is TabDef => Boolean(t.label));

  // Map oprávnení podľa aktuálne vybratej roly
  const permissions: Record<RoleType, string[]> = {
    student: studentPerms,
    company: companyPerms,
    garant: garantPerms,
  };

  const currentPerms = Array.isArray(permissions[tab]) ? permissions[tab] : [];

  return (
    <section id="roles" className="section bg-paper">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">{msgs.common.role.title}</h2>
        <p className="text-ink-500 mb-6">{msgs.common.role.subtitle}</p>

        <div className="grid md:grid-cols-[220px,1fr] gap-5">
          <div className="card p-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b border-primary-300 last:border-b-0 ${tab === t.key ? "bg-soft text-primary-700 font-medium" : "hover:bg-soft"}`}
              >
                <span className="badge">
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
                  className={`px-3 py-2 rounded-lg border border-primary-600 text-primary-700 text-sm ${tab === t.key ? "bg-primary-600 text-white border-primary-600" : "hover:bg-soft"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-2">{msgs.common.role.permissions}</div>
                <ul className="space-y-2">
                  {currentPerms.map((perm, idx) => (
                    <li key={`${tab}-perm-${idx}`} className="flex items-start gap-2">
                      <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 text-primary-600" />
                      <span>{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">{msgs.common.role.previewTitle}</div>
                <div className="rounded-xl border border-primary-200 bg-white p-4">
                  {/* Náhľad dashboardu podľa vybratej roly cesty sú v roleSectionDatas */}
                  <Image
                    src={roleImages[tab]}
                    alt={`${tabs.find((t) => t.key === tab)?.label} dashboard preview`}
                    width={960}
                    height={600}
                    className="w-full rounded-lg border border-primary-200 shadow-soft"
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
