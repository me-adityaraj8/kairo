import { InputHTMLAttributes, forwardRef, useId } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const GameInput = forwardRef<HTMLInputElement, Props>(function GameInput(
  { label, error, id, className = "", ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider text-dim">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-[15px] text-text
          placeholder:text-dim/60 transition-colors focus:bg-black/40
          ${error ? "border-danger/70" : "border-white/12 focus:border-xp/60"} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export default GameInput;
