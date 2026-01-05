import type React from "react";
import Icon from "@icons/index";
import { STAV_OPTIONS, STAV_LABEL, StringOrNull, Stav } from "@shared-types/index";
import { Internship, GarantInternshipUpdate } from "@shared-types/internship";
import { DatePicker } from "@components/datePicker";

type SearchResult = {
  id: number;
  meno?: string | null;
  priezvisko?: string | null;
  email?: string | null;
  nazov?: string | null;
  kontakt_email?: string | null;
};

type Props = {
  internship: Internship | null;
  editForm: GarantInternshipUpdate | null;
  editError: StringOrNull;
  msgs: any;
  studentQuery: string;
  companyQuery: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onEditInput: (name: keyof GarantInternshipUpdate, value: string | Stav) => void;
  onStudentQueryChange: (val: string) => void;
  onCompanyQueryChange: (val: string) => void;
  onSelectStudent: (id: number, label: string) => void;
  onSelectCompany: (id: number, label: string) => void;
  studentSearch: { isFetching: boolean; data?: SearchResult[] };
  companySearch: { isFetching: boolean; data?: SearchResult[] };
  isSubmitting: boolean;
};

export default function GarantEditModal({
  internship,
  editForm,
  editError,
  msgs,
  studentQuery,
  companyQuery,
  onClose,
  onSubmit,
  onEditInput,
  onStudentQueryChange,
  onCompanyQueryChange,
  onSelectStudent,
  onSelectCompany,
  studentSearch,
  companySearch,
  isSubmitting,
}: Readonly<Props>) {
  if (!internship || !editForm) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-ink-900">
              {msgs.common.guarant.edit.title} #{internship.id}
            </h3>
            <p className="text-sm text-ink-500">{msgs.common.guarant.edit.description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border p-2 hover:bg-gray-50"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {editError && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-2 text-red-700 text-sm">
            {editError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* STUDENT SEARCH */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.edit.studentSearch}
            </label>

            <input
              type="text"
              value={studentQuery}
              onChange={(e) => onStudentQueryChange(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />

            {studentSearch.isFetching && (
              <p className="text-xs text-ink-400 mt-1">{msgs.common.loading.loading}</p>
            )}

            {studentSearch.data?.length ? (
              <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto divide-y">
                {studentSearch.data.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const label =
                          `${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim() || s.email || `#${s.id}`;
                        onSelectStudent(s.id, label);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-primary-50"
                    >
                      <span className="font-medium">
                        {`${s.meno ?? ""} ${s.priezvisko ?? ""}`.trim()}
                      </span>
                      <div className="text-xs text-ink-500">{s.email}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* COMPANY SEARCH */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.edit.companySearch}
            </label>

            <input
              type="text"
              value={companyQuery}
              onChange={(e) => onCompanyQueryChange(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />

            {companySearch.isFetching && (
              <p className="text-xs text-ink-400 mt-1">{msgs.common.loading.loading}</p>
            )}

            {companySearch.data?.length ? (
              <ul className="border mt-2 rounded-md max-h-40 overflow-y-auto divide-y">
                {companySearch.data.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelectCompany(c.id, c.nazov || `#${c.id}`)}
                      className="w-full px-3 py-2 text-left hover:bg-primary-50"
                    >
                      <span className="font-medium">{c.nazov || `#${c.id}`}</span>
                      <div className="text-xs text-ink-500">{c.kontakt_email}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* DATES */}
          <DatePicker
            className="mt-1"
            startLabel={msgs.common.guarant.edit.startDate}
            endLabel={msgs.common.guarant.edit.endDate}
            startValue={editForm.datum_zaciatku}
            endValue={editForm.datum_konca}
            onChange={(field, value) => onEditInput(field, value)}
          />

          {/* STATE */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.filters.state}
            </label>
            <select
              name="stav"
              value={editForm.stav}
              onChange={(e) => onEditInput("stav", e.target.value as Stav)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {STAV_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {STAV_LABEL[o.value]}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS NOTE */}
          <div>
            <label className="text-xs font-semibold uppercase text-ink-500">
              {msgs.common.guarant.edit.statusNote}
            </label>
            <textarea
              name="status_note"
              value={editForm.status_note}
              onChange={(e) => onEditInput("status_note", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-primary-600 px-4 py-2 text-sm text-primary-600 font-semibold"
            >
              {msgs.common.close}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? msgs.common.loading.loading : msgs.common.guarant.edit.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
