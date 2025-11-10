"use client";

import { useEffect, useState, useCallback } from "react";
import axiosClient from "@/lib/axiosClient";
import { useLocalization } from "@/shared/i18n/client";
import { Table } from "@/shared/components/table";
import { TABLE_NAMES } from "@/constants/Table";
import { Internship } from "@/shared/types/internship/internship";
import { useSystemNotifications } from "@/shared/components/notifications";
import { Button } from "@/shared/components/button";

type PendingResponse = {
  results?: {
    firma?: {
      meno?: string | null;
      priezvisko?: string | null;
      email: string;
    };
    internships?: Internship[];
  };
};

type PendingInternshipsProps = {
  onChange?: () => void;
};

export default function PendingInternships({ onChange }: Readonly<PendingInternshipsProps>) {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const { msgs } = useLocalization();
  const { success: notifySuccess, warning: notifyWarning } = useSystemNotifications();

  // Získa access_token z localStorage a vráti ho v hlavičke Authorization, ak chýba, vyhodí chybu
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      throw new Error("Chýba access token – prihláste sa ako firma.");
    }
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Volá API endpoint, ukladá načítané praxe do state
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get<PendingResponse>(
        "/internships/company/me/internships/pending/",
        { headers: getAuthHeaders() },
      );
      const list = res.data.results?.internships ?? [];
      setInternships(list);
    } catch (err: any) {
      const message =
        err.response?.data?.error || err.message || msgs.common.error.errorLoadInternships;
      setError(message);
      notifyWarning({
        title: msgs.common.error.errorLoadInternships,
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, msgs.common.error.errorLoadInternships, notifyWarning]);

  // Načíta čakajúce praxe po načítaní komponentu
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Potvrdí alebo zamietne prax a odstráni ju zo zoznamu
  const handleAction = async (id: number, action: "confirm" | "reject") => {
    setError("");
    try {
      const endpoint = `/internships/company/${action}/${id}/`;
      await axiosClient.patch(endpoint, {}, { headers: getAuthHeaders() });
      setInternships((prev) => prev.filter((item) => item.id !== id));
      onChange?.();
      notifySuccess({
        title:
          action === "confirm" ? msgs.common.internships.management : msgs.common.error.errorAction,
        description:
          action === "confirm" ? msgs.common.internships.new : msgs.common.error.errorAction,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || msgs.common.error.errorAction;
      setError(message);
      notifyWarning({
        title: msgs.common.error.errorAction,
        description: message,
      });
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">{msgs.common.loading.pending}</p>;
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600">{error}</p>
        <Button type="button" variant="primary" className="mt-4" onClick={fetchPending}>
          {msgs.common.tryAgain}
        </Button>
      </div>
    );
  }

  return (
    <Table
      data={internships}
      name={TABLE_NAMES.PENDING_INTERNSHIPS}
      rowActions
      onAction={handleAction}
      actionMessage={msgs.common.internships.empty}
      isLoading={loading}
      isError={error || null}
      showEmpty
    />
  );
}
