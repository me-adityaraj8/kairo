import { InputHTMLAttributes, forwardRef, useId } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const PixelInput = forwardRef<HTMLInputElement, Props>(function PixelInput(
  { label, error, id, className = "", ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-mono text-xs text-muted">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`border-[3px] border-border bg-bg px-3 py-2 font-mono text-sm text-text
          placeholder:text-muted focus-visible:border-gold ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="font-mono text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

export default PixelInput;
