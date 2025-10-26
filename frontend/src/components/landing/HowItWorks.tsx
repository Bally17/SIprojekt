export default function HowItWorks() {
  const steps = [
    "Registrácia",
    "Vytvor prax",
    "Potvrdenie firmou",
    "Schválenie garantom",
    "Výkaz a uzavretie",
  ];

  return (
    <section className="bg-blue-900 text-white py-20 text-center">
      <h2 className="text-3xl font-bold mb-12">Ako to funguje?</h2>
      <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white text-blue-900 p-6 rounded-lg shadow-md w-48 hover:scale-105 transition-transform"
          >
            <div className="text-3xl font-bold mb-2">{index + 1}</div>
            <p className="font-medium">{step}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
