export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse border-[3px] border-border bg-border/30 ${className}`} />;
}
