"use client";
import React from "react";

export type Option<T extends string> = { value: T; label: string };

type SelectComponentProps<T extends string> = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
> & {
  value: T | "";
  options: ReadonlyArray<Option<T>>;
  onChangeValue: (val: T | "") => void;
  emptyOptionLabel?: string;
};

const base = "border w-full rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500";

export default function SelectComponent<T extends string>({
  value,
  options,
  onChangeValue,
  className,
  emptyOptionLabel,
  ...rest
}: SelectComponentProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChangeValue(e.target.value as T | "")}
      className={`${base} ${className ?? ""}`}
      {...rest}
    >
      {emptyOptionLabel !== undefined && <option value="">{emptyOptionLabel}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
