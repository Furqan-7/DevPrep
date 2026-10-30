/** DevPrep logo mark drawn with currentColor so it adapts to light and dark themes. */
export default function DevPrepMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 5h7a7 7 0 0 1 0 14H9.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="2.6" y="11" width="4" height="4" rx="1.2" fill="currentColor" />
    </svg>
  );
}
