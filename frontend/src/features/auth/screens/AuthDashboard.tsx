"use client";

import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Button } from "@components/button";
import { useLocalization } from "@i18n/client";
import { RoleType } from "@shared-types/core/common";

type AuthDashboardContextValue = {
  userType: RoleType;
  setUserType: (role: RoleType) => void;
  isStudent: boolean;
  isCompany: boolean;
  isGarant: boolean;
};

const AuthDashboardContext = createContext<AuthDashboardContextValue | null>(null);

export function useAuthDashboard() {
  const ctx = useContext(AuthDashboardContext);
  if (!ctx) {
    throw new Error("useAuthDashboard must be used within <AuthDashboard />");
  }
  return ctx;
}

type AuthDashboardProps = {
  children: ReactNode;
  initialUserType?: RoleType;
  title?: ReactNode; // ak chceš prepísať nadpis
};

const AuthDashboard = ({ children, initialUserType = "student", title }: AuthDashboardProps) => {
  const { msgs } = useLocalization();

  const [userType, setUserType] = useState<RoleType>(initialUserType);

  const value = useMemo<AuthDashboardContextValue>(() => {
    const isStudent = userType === "student";
    const isCompany = userType === "company";
    const isGarant = userType === "garant";
    return { userType, setUserType, isStudent, isCompany, isGarant };
  }, [userType]);

  return (
    <AuthDashboardContext.Provider value={value}>
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-ink-900 text-center">
          {title ?? msgs.auth.title}
        </h2>

        <div className="mb-4 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            onClick={() => setUserType("student")}
            variant={value.isStudent ? "primary" : "ghost"}
            className={`rounded-full px-4 py-2 text-sm ${
              value.isStudent ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-pressed={value.isStudent}
          >
            {msgs.common.entities.student}
          </Button>

          <Button
            type="button"
            onClick={() => setUserType("company")}
            variant={value.isCompany ? "primary" : "ghost"}
            className={`rounded-full px-4 py-2 text-sm ${
              value.isCompany ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-pressed={value.isCompany}
          >
            {msgs.common.entities.company}
          </Button>

          <Button
            type="button"
            onClick={() => setUserType("garant")}
            variant={value.isGarant ? "primary" : "ghost"}
            className={`rounded-full px-4 py-2 text-sm ${
              value.isGarant ? "" : "border-0 bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            aria-pressed={value.isGarant}
          >
            {msgs.common.entities.guarant}
          </Button>
        </div>

        {children}
      </div>
    </AuthDashboardContext.Provider>
  );
};

export default AuthDashboard;
