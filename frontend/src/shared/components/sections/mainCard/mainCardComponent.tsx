"use client";

import React from "react";
import DashboardNavbar from "@/shared/components/navbar/dashboard/DashboardNavbar";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClassName?: string; // ak chceš občas inú šírku
};

const mainCardComponent = ({
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-5xl",
}: Props) => {
  return (
    <>
      <DashboardNavbar />
      <main className="min-h-screen bg-gradient-to-b from-cyan-50 to-white p-6 pt-6">
        <div className={`${maxWidthClassName} mx-auto space-y-10`}>
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-cyan-700 tracking-tight">{title}</h1>
            {subtitle ? <p className="text-gray-600">{subtitle}</p> : null}
          </header>

          {children}
        </div>
      </main>
    </>
  );
};

export default mainCardComponent;
