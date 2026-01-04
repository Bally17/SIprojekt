import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { CreateInternshipPayload } from "@shared-types/index";

export type ViewMode = "day" | "month" | "year"; // year = dekáda

export type DatesDict = {
  mon: string;
  tues: string;
  wed: string;
  thur: string;
  fri: string;
  sat: string;
  sun: string;
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
};

type BaseProps = {
  startLabel: string;
  endLabel: string;
  className?: string;
};

export type RhfDatePickerProps = BaseProps & {
  register: UseFormRegister<CreateInternshipPayload>;
  setValue: UseFormSetValue<CreateInternshipPayload>;
  watch: UseFormWatch<CreateInternshipPayload>;
};

export type ControlledDatePickerProps = BaseProps & {
  startValue: string;
  endValue: string;
  onChange: (field: "datum_zaciatku" | "datum_konca", value: string) => void;
};

export type DatePickerProps = RhfDatePickerProps | ControlledDatePickerProps;
