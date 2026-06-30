import { BrandLogo } from "./BrandLogo";
import { ClientLogo } from "./ClientLogo";

type BrandBarProps = {
  className?: string;
  compact?: boolean;
};

export function BrandBar({ className = "", compact = false }: BrandBarProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandLogo compact={compact} />
      <div className="h-8 w-px bg-white/15" aria-hidden />
      <ClientLogo className={compact ? "h-8 w-8" : "h-9 w-9 md:h-10 md:w-10"} />
      {!compact && (
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-white/40">
            Отчёт пилота
          </p>
          <p className="truncate text-sm font-semibold text-white/90">IRB Family</p>
        </div>
      )}
    </div>
  );
}
