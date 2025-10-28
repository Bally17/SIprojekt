export default function Footer() {
  return (
    <footer id="contact" className="bg-night text-white">
      <div className="container-wide py-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white grid place-items-center text-night font-bold">
            P
          </div>
          <span className="text-xl font-semibold">Praxy</span>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-8 text-sm">
          <div>
            <div className="font-semibold mb-3">Menu</div>
            <ul className="space-y-2 text-white/80">
              <li>
                <a href="#how" className="hover:underline">
                  Ako to funguje
                </a>
              </li>
              <li>
                <a href="#features" className="hover:underline">
                  Funkcie
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:underline">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:underline">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Prihlásenie/Registrácia</div>
            <ul className="space-y-2 text-white/80">
              <li>Prihlásiť sa</li>
              <li>Registrácia pre študentov</li>
              <li>Registrácia pre firmy</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Mobil</div>
            <div className="flex gap-3 opacity-80">
              <div className="h-10 w-32 rounded-lg bg-white/10 grid place-items-center">
                App Store
              </div>
              <div className="h-10 w-32 rounded-lg bg-white/10 grid place-items-center">
                Google Play
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-white/60">
          Praxy.sk © {new Date().getFullYear()}. Všetky práva vyhradené.
        </div>
      </div>
    </footer>
  );
}
