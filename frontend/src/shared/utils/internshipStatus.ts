import type { Messages } from "@i18n/getMessages";
import { STAVY, type Stav, isStav } from "@shared-types/core/internshipState";

type StatusLabels = Record<Stav, string>;

const getStatusLabels = (msgs: Messages): StatusLabels => ({
  vytvorena: msgs.common.internships.statusLabels.vytvorena,
  potvrdena: msgs.common.internships.statusLabels.potvrdena,
  zamietnuta: msgs.common.internships.statusLabels.zamietnuta,
  schvalena: msgs.common.internships.statusLabels.schvalena,
  obhajena: msgs.common.internships.statusLabels.obhajena,
  neobhajena: msgs.common.internships.statusLabels.neobhajena,
});

export const getInternshipStatusLabel = (
  value: string | null | undefined,
  msgs: Messages,
): string => {
  if (!value) return "";
  if (!isStav(value)) return value;
  const labels = getStatusLabels(msgs);
  return labels[value] || value;
};

export const getInternshipStatusOptions = (msgs: Messages, values: readonly Stav[] = STAVY) =>
  values.map((value) => ({
    value,
    label: getInternshipStatusLabel(value, msgs),
  }));
