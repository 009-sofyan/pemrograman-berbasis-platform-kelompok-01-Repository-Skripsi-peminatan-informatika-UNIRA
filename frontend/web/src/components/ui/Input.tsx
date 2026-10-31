import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

const fieldBase =
  "w-full rounded-input border bg-white text-sm text-ink placeholder:text-ink-faint/80 shadow-[0_1px_2px_rgba(20,35,79,0.04)] transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-navy-50/60 disabled:text-ink-faint";

const stateClass = (invalid: boolean) =>
  invalid
    ? "border-coral-300 focus:border-coral-400 focus:ring-coral-100"
    : "border-navy-100 hover:border-navy-200 focus:border-primary-400 focus:ring-primary-100";

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="flex items-center gap-1 text-xs font-bold text-navy-800"
        >
          {label}
          {required ? (
            <span className="text-coral-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs font-medium text-coral-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    icon: Icon,
    rightElement,
    wrapperClassName,
    className,
    id,
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            fieldBase,
            stateClass(Boolean(error)),
            "h-11 px-3.5",
            Icon && "pl-10",
            rightElement && "pr-12",
            className,
          )}
          {...props}
        />
        {rightElement ? (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        ) : null}
      </div>
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, wrapperClassName, className, id, required, ...props },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldShell
        id={inputId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            fieldBase,
            stateClass(Boolean(error)),
            "min-h-28 resize-y px-3.5 py-3 leading-relaxed",
            className,
          )}
          {...props}
        />
      </FieldShell>
    );
  },
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, wrapperClassName, className, id, required, children, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldShell
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          fieldBase,
          stateClass(Boolean(error)),
          "h-11 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%235B6785%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22/%3E%3C/svg%3E')] bg-[position:right_0.9rem_center] bg-no-repeat py-0 pl-3.5 pr-10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export { FieldShell };
