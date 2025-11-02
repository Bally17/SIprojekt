import CompanyInternshipsDashboard from "@/features/company/CompanyInternshipsDashboard";

export default function CompanyInternshipsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white border border-gray-100 shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-semibold text-cyan-700">Správa praxí</h1>
          <p className="text-gray-600">
            Pozrite si čakajúce žiadosti, potvrďte alebo zamietnite praxe a filtrujte ich podľa
            roka, semestra a stavu.
          </p>
        </header>
        <CompanyInternshipsDashboard />
      </div>
    </main>
  );
}
