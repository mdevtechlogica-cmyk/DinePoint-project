export function EyeIcon({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {revealed ? (
        <path d="M5 19 19 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
