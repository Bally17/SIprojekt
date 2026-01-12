import Icon from "@icons/index";
import { STAV_BADGE_CLASS, StringOrNull } from "@shared-types/index";
import { Internship } from "@shared-types/internship";
import { getInternshipStatusLabel } from "@utils/internshipStatus";
import { getInternshipSemesterLabel } from "@utils/internshipSemester";

interface GarantInternshipsTableSectionProps {
  internships: Internship[];
  loading: boolean;
  errorMessage: StringOrNull;
  msgs: any;
  onEdit: (i: Internship) => void;
}

export function GarantInternshipsTableSection({
  internships,
  loading,
  errorMessage,
  msgs,
  onEdit,
}: Readonly<GarantInternshipsTableSectionProps>) {
  let body = null;

  if (loading) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-500">
          {msgs.common.loading.internships}
        </td>
      </tr>
    );
  } else if (errorMessage) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-red-600">
          {errorMessage}
        </td>
      </tr>
    );
  } else if (internships.length === 0) {
    body = (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-400">
          {msgs.common.error.errorFilterLoad}
        </td>
      </tr>
    );
  } else {
    body = (
      <>
        {internships.map((i) => (
          <tr key={i.id}>
            <td className="px-4 py-4 text-sm text-ink-900">
              <div className="font-semibold">{i.student_full_name || `#${i.student}`}</div>
              <div className="text-xs text-ink-400">{i.student_email}</div>
            </td>

            <td className="px-4 py-4 text-sm text-ink-900">{i.company_name || "-"}</td>

            <td className="px-4 py-4 text-sm text-ink-900">{i.study_program || "-"}</td>

            <td className="px-4 py-4 text-sm text-ink-900">
              <div>
                {i.rok} - {getInternshipSemesterLabel(i.semester, msgs)}
              </div>
              <div className="text-xs text-ink-400">
                {i.datum_zaciatku} - {i.datum_konca}
              </div>
            </td>

            <td className="px-4 py-4 text-sm">
              <span
                className={`inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                  i.stav ? STAV_BADGE_CLASS[i.stav] : "bg-gray-100 text-gray-600"
                }`}
              >
                {getInternshipStatusLabel(i.stav, msgs)}
              </span>
            </td>

            <td className="px-4 py-4 text-sm">
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary-600 bg-white text-primary-600 hover:bg-primary-50"
                aria-label={msgs.common.guarant.edit.title}
              >
                <Icon name="pencil" className="h-4 w-4" />
              </button>
            </td>
          </tr>
        ))}
      </>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-primary-200 bg-white p-6 shadow-sm">
      <h2 className="text-3xl font-semibold text-ink-900">{msgs.common.guarant.tableTitle}</h2>
      <p className="text-sm text-ink-500">{msgs.common.guarant.tableSubtitle}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary-200">
          <thead className="bg-primary-50">
            <tr>
              {[
                msgs.common.guarant.table.student,
                msgs.common.guarant.table.company,
                msgs.common.guarant.table.program,
                msgs.common.guarant.table.term,
                msgs.common.internships.state,
                msgs.common.guarant.table.actions,
              ].map((t) => (
                <th
                  key={t}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-900"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{body}</tbody>
        </table>
      </div>
    </section>
  );
}

export default GarantInternshipsTableSection;
