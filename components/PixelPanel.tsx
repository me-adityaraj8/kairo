import { ReactNode } from "react";

export default function PixelPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-border bg-panel ${className}`}>
      {title && (
        <div className="border-b-[3px] border-border px-3 py-2 font-pixel text-[10px] uppercase tracking-wider text-gold">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
