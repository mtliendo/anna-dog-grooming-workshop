export function PawMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="22" cy="22" rx="8" ry="10" fill="currentColor" />
      <ellipse cx="42" cy="22" rx="8" ry="10" fill="currentColor" />
      <ellipse cx="16" cy="40" rx="7" ry="8" fill="currentColor" />
      <ellipse cx="48" cy="40" rx="7" ry="8" fill="currentColor" />
      <ellipse cx="32" cy="42" rx="11" ry="10" fill="currentColor" />
    </svg>
  );
}

export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10,
        height: 10,
        marginTop: 5,
        borderRadius: 99,
        background: ok ? "#1F5C3A" : "#C86D2D",
      }}
    />
  );
}
