type BrandLogoProps = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  const markSize = compact ? "h-7" : "h-9 md:h-10";

  return (
    <div className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <img
        src="/hr-rocket-mark.png"
        alt=""
        aria-hidden
        className={`${markSize} w-auto object-contain`}
      />
      <div className="leading-none">
        <span
          className={`block font-extrabold tracking-tight text-white ${
            compact ? "text-sm" : "text-base md:text-lg"
          }`}
        >
          HR
        </span>
        <span
          className={`mt-0.5 block font-semibold tracking-tight text-slate-300 ${
            compact ? "text-xs" : "text-sm md:text-base"
          }`}
        >
          Rocket
        </span>
      </div>
    </div>
  );
}
