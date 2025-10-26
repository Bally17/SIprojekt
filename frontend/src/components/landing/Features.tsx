export default function Features() {
  const features = [
    { title: "Evidencia praxí", icon: "🗂️" },
    { title: "Workflow stavov", icon: "🔄" },
    { title: "Generovanie PDF", icon: "📄" },
    { title: "Nahrávanie dokumentov", icon: "📎" },
    { title: "Export CSV", icon: "📊" },
    { title: "Notifikácie emailom", icon: "📬" },
    { title: "API (OAuth 2.0)", icon: "🔑" },
    { title: "Reporty / Filtre", icon: "📈" },
  ];

  return (
    <section className="py-20 bg-white text-center" id="features">
      <h2 className="text-3xl font-bold text-blue-900 mb-12">Funkcie</h2>
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-gray-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100"
          >
            <div className="text-4xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800">{feature.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
