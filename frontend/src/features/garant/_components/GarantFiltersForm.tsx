import type { UseFormRegister } from "react-hook-form";
import { getInternshipStatusOptions } from "@utils/internshipStatus";

type Filters = {
  rok: string;
  firma: string;
  student: string;
  odbor: string;
  stav: string;
};

type Props = {
  filters: Filters;
  register: UseFormRegister<Filters>;
  msgs: any;
  onApply: (event?: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
};

export default function GarantFiltersForm({
  filters,
  register,
  msgs,
  onApply,
  onReset,
}: Readonly<Props>) {
  return (
    <section className="space-y-6 rounded-lg border border-primary-200 bg-white p-6 shadow-sm">
      <p className="text-3xl font-semibold text-ink-900">{msgs.common.guarant.filtersTitle}</p>
      <p className="text-sm text-ink-500">{msgs.common.guarant.filtersDescription}</p>

      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => onApply(event)}
      >
        <div>
          <label className="text-xs font-semibold uppercase text-ink-500">
            {msgs.common.guarant.filters.year}
          </label>
          <input
            type="number"
            value={filters.rok}
            {...register("rok")}
            className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500">
            {msgs.common.guarant.filters.company}
          </label>
          <input
            type="text"
            value={filters.firma}
            {...register("firma")}
            className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500">
            {msgs.common.guarant.filters.student}
          </label>
          <input
            type="text"
            value={filters.student}
            {...register("student")}
            className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500">
            {msgs.common.guarant.filters.field}
          </label>
          <input
            type="text"
            value={filters.odbor}
            {...register("odbor")}
            className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-ink-500">
            {msgs.common.guarant.filters.state}
          </label>
          <select
            value={filters.stav}
            {...register("stav")}
            className="mt-1 w-full rounded-md border border-primary-200 bg-white/90 px-3 py-2 text-sm transition hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{msgs.common.guarant.filters.statePlaceholder}</option>
            {getInternshipStatusOptions(msgs).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {msgs.common.filter}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-md border border-primary-600 text-primary-600 px-4 py-2 text-sm font-semibold"
          >
            {msgs.common.reset}
          </button>
        </div>
      </form>
    </section>
  );
}
