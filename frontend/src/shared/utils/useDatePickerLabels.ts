"use client";

import { useMemo } from "react";
import { useLocalization } from "@i18n/client";

export function useDatePickerLabels() {
  const { msgs } = useLocalization();

  const weekdays = useMemo(
    () => [
      msgs.common.dates.mon,
      msgs.common.dates.tues,
      msgs.common.dates.wed,
      msgs.common.dates.thur,
      msgs.common.dates.fri,
      msgs.common.dates.sat,
      msgs.common.dates.sun,
    ],
    [
      msgs.common.dates.mon,
      msgs.common.dates.tues,
      msgs.common.dates.wed,
      msgs.common.dates.thur,
      msgs.common.dates.fri,
      msgs.common.dates.sat,
      msgs.common.dates.sun,
    ],
  );

  const months = useMemo(
    () => [
      msgs.common.dates.january,
      msgs.common.dates.february,
      msgs.common.dates.march,
      msgs.common.dates.april,
      msgs.common.dates.may,
      msgs.common.dates.june,
      msgs.common.dates.july,
      msgs.common.dates.august,
      msgs.common.dates.september,
      msgs.common.dates.october,
      msgs.common.dates.november,
      msgs.common.dates.december,
    ],
    [
      msgs.common.dates.january,
      msgs.common.dates.february,
      msgs.common.dates.march,
      msgs.common.dates.april,
      msgs.common.dates.may,
      msgs.common.dates.june,
      msgs.common.dates.july,
      msgs.common.dates.august,
      msgs.common.dates.september,
      msgs.common.dates.october,
      msgs.common.dates.november,
      msgs.common.dates.december,
    ],
  );

  return { weekdays, months };
}
