export function SectionHeader({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div id={id} className="mb-8 max-w-3xl scroll-mt-24">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-hr-pink)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-slate-400 md:text-lg">{description}</p>
      )}
    </div>
  );
}
