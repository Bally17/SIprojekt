import StudentInternships from "@/components/student/StudentInternships";

export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-semibold text-cyan-700">Moje praxe</h1>
          <p className="text-gray-600">Pozri si svoje praxe a stiahni dohodu o odbornej praxi.</p>
        </header>
        <StudentInternships />
      </div>
    </main>
  );
}
