type ClientLogoProps = {
  className?: string;
};

export function ClientLogo({ className = "h-9 w-9 md:h-10 md:w-10" }: ClientLogoProps) {
  return (
    <img
      src="/irb-family-logo.png"
      alt="IRB Family"
      className={`shrink-0 rounded-md object-cover ring-1 ring-white/10 ${className}`}
    />
  );
}
