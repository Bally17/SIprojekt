"use client";

import { useMemo } from "react";
import { Button } from "@components/button";
import { Table } from "@components/table";
import { useSystemNotifications } from "@components/notifications";
import { useLocalization } from "@i18n/client";
import { TABLE_NAMES } from "src/constants/Table";

import { usePendingInternshipsQuery } from "src/hook/usePendingInternshipsQuery";
import { useConfirmInternshipMutation } from "src/hook/useConfirmInternshipMutation";
import { useRejectInternshipMutation } from "src/hook/useRejectInternshipMutation";
import { Action } from "@shared-types/core/common";
import { getErrorMessage } from "@utils/errorActions";

type PendingInternshipsProps = {
  onChange?: () => void;
};

export default function PendingInternships({ onChange }: Readonly<PendingInternshipsProps>) {
  const { msgs } = useLocalization();
  const { success, warning } = useSystemNotifications();

  const pending = usePendingInternshipsQuery();
  const confirmMutation = useConfirmInternshipMutation();
  const rejectMutation = useRejectInternshipMutation();

  const internships = useMemo(() => {
    const list = pending.data?.results?.internships ?? [];
    return Array.isArray(list) ? list : [];
  }, [pending.data?.results?.internships]);

  const handleAction = async (id: number, action: Action) => {
    try {
      if (action === "confirm") {
        await confirmMutation.mutateAsync(id);
        success({
          title: msgs.common.internships.management,
          description: msgs.common.internships.new,
        });
      } else {
        await rejectMutation.mutateAsync(id);
        warning({
          title: msgs.common.error.errorAction,
          description: msgs.common.error.errorAction,
        });
      }

      onChange?.();
    } catch (err: any) {
      warning({
        title: msgs.common.error.errorAction,
        description: getErrorMessage(err, msgs.common.error.errorLoadInternships),
      });
    }
  };

  if (pending.isLoading) {
    return <p className="text-center text-gray-500">{msgs.common.loading.pending}</p>;
  }

  if (pending.isError) {
    return (
      <div className="text-center">
        <p className="text-red-600">
          {getErrorMessage(pending.error, msgs.common.error.errorLoadInternships)}
        </p>

        <Button type="button" variant="primary" className="mt-4" onClick={() => pending.refetch()}>
          {msgs.common.tryAgain}
        </Button>
      </div>
    );
  }

  const pendingError = (pending as { error?: unknown }).error;

  return (
    <Table
      data={internships}
      name={TABLE_NAMES.PENDING_INTERNSHIPS}
      rowActions
      onAction={handleAction}
      actionMessage={msgs.common.internships.empty}
      isLoading={pending.isLoading}
      isError={
        pending.isError
          ? getErrorMessage(pendingError, msgs.common.error.errorLoadInternships)
          : null
      }
      showEmpty
    />
  );
}
