import { BrandBar } from "./BrandBar";

const navItems = [
  { href: "#goals", label: "Цели" },
  { href: "#dynamics", label: "Динамика" },
  { href: "#pilot-vs-control", label: "Пилот vs Контроль" },
  { href: "#segments", label: "Сегменты" },
  { href: "#whatwedid", label: "Пилот" },
  { href: "#conclusions", label: "Итог" },
  { href: "#roadmap", label: "Дальше" },
];

export function ReportHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className="brand-stripe" />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <a href="#" className="flex items-center">
          <BrandBar />
        </a>
        <nav className="hidden gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
