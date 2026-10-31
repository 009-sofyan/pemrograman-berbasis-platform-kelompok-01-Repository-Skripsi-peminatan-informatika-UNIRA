import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { useClickOutside } from "../../hooks/useClickOutside";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function SelectMenu({
  label,
  value,
  options,
  onChange,
  placeholder = "Pilih opsi",
  className,
  align = "left",
}: {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useClickOutside(containerRef, () => setOpen(false), open);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-0", className)}>
      {label ? (
        <span className="mb-1.5 block text-xs font-bold text-navy-800">{label}</span>
      ) : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label ? `${label}: ${selected?.label ?? placeholder}` : undefined}
        onClick={() => {
          setOpen((current) => !current);
          setActiveIndex(
            Math.max(0, options.findIndex((option) => option.value === value)),
          );
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              return;
            }
            const delta = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((index) => (index + delta + options.length) % options.length);
          } else if (event.key === "Home" && open) {
            event.preventDefault();
            setActiveIndex(0);
          } else if (event.key === "End" && open) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          } else if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            commit(activeIndex);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-input border bg-white px-3.5 text-left text-xs font-semibold text-navy-800 shadow-[0_1px_2px_rgba(20,35,79,0.04)] transition",
          open
            ? "border-primary-400 ring-4 ring-primary-100"
            : "border-navy-100 hover:border-navy-200",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-faint transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label ?? "Pilihan"}
          className={cn(
            "absolute z-40 mt-2 max-h-72 w-full min-w-[180px] overflow-y-auto rounded-card border border-white/80 bg-white p-1.5 shadow-elevated animate-slide-down",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  commit(index);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition",
                  index === activeIndex
                    ? "bg-navy-50 text-navy-900"
                    : "text-ink-soft",
                  isSelected && "text-primary-700",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-ink-faint">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
                {isSelected ? <Check className="size-3.5 shrink-0 text-primary-600" /> : null}
              </li>
            );
          })}
          {options.length === 0 ? (
            <li className="px-3 py-3 text-xs text-ink-faint">Tidak ada pilihan.</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
