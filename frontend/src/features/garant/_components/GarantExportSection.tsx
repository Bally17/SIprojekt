type Props = {
  exporting: boolean;
  msgs: any;
  onExport: () => void;
};

export default function GarantExportSection({ exporting, msgs, onExport }: Readonly<Props>) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/70 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-primary-900">
          {msgs.common.guarant.exportTitle}
        </h2>
        <p className="text-sm text-primary-800">{msgs.common.guarant.exportDescription}</p>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={exporting}
        className="inline-flex items-center justify-center rounded-md border border-primary-600 px-4 py-2 text-sm text-primary-600 font-semibold disabled:opacity-60"
      >
        {exporting ? msgs.common.guarant.exporting : msgs.common.guarant.exportButton}
      </button>
    </section>
  );
}
