export function FloatingBall({ className = "" }: { className?: string }) {
  return (
    <div className={`floating-ball ${className}`} aria-hidden>
      <span>⚽</span>
    </div>
  );
}
