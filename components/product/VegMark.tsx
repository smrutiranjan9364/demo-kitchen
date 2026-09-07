// The FSSAI vegetarian / non-vegetarian mark: green dot or brown triangle in
// a square. Undefined counts as vegetarian, matching the DB default.
export default function VegMark({
  veg = true,
  className = "h-3.5 w-3.5",
}: {
  veg?: boolean;
  className?: string;
}) {
  const colour = veg ? "#15803d" : "#7c2d12";
  const label = veg ? "Vegetarian" : "Non-vegetarian";
  return (
    <svg viewBox="0 0 16 16" role="img" aria-label={label} className={`shrink-0 ${className}`}>
      <title>{label}</title>
      <rect x="1" y="1" width="14" height="14" fill="none" stroke={colour} strokeWidth="1.5" />
      {veg ? (
        <circle cx="8" cy="8" r="3.5" fill={colour} />
      ) : (
        <path d="M8 4.2 12.2 11.8H3.8Z" fill={colour} />
      )}
    </svg>
  );
}
