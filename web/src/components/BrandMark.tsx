interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
}

export function BrandMark({ className = "", showWordmark = true }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <svg
        aria-hidden
        viewBox="0 0 96 96"
        className="h-8 w-8 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M76.98 40.24A30 30 0 1 1 55.76 18.98"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="48" cy="48" r="11" fill="currentColor" />
      </svg>
      {showWordmark && <span className="font-display text-lg font-bold leading-none">PreciosFarma</span>}
    </span>
  );
}
