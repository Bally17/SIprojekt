export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-2xl font-bold flex items-center gap-2">
          <div className="bg-white text-blue-900 rounded-md px-2 py-1">P</div> Praxy
        </div>

        <div className="flex flex-col md:flex-row gap-10 text-sm text-gray-200">
          <div>
            <p className="font-semibold mb-2 text-white">Menu</p>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Ako to funguje</a></li>
              <li><a href="#" className="hover:underline">Funkcie</a></li>
              <li><a href="#" className="hover:underline">FAQ</a></li>
              <li><a href="#" className="hover:underline">Kontakt</a></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2 text-white">Prihlásenie / Registrácia</p>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Prihlásiť sa</a></li>
              <li><a href="#" className="hover:underline">Registrácia pre študentov</a></li>
              <li><a href="#" className="hover:underline">Registrácia pre firmy</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-300 py-4 border-t border-white/10 text-sm">
        © {new Date().getFullYear()} Praxy.sk – všetky práva vyhradené
      </div>
    </footer>
  );
}
