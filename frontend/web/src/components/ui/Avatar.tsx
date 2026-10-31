import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { initials } from "../../lib/format";

const GRADIENTS = [
  "from-primary-500 to-violet-500",
  "from-bi-500 to-sky-400",
  "from-sa-500 to-emerald-400",
  "from-gold-400 to-amber-500",
  "from-coral-500 to-rose-400",
  "from-navy-700 to-navy-500",
];

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const index = name
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0) % GRADIENTS.length;

  const sizeClass = {
    sm: "size-8 rounded-lg text-[10px]",
    md: "size-10 rounded-input text-xs",
    lg: "size-14 rounded-card text-base",
    xl: "size-24 rounded-panel text-2xl",
  }[size];

  const showImage = Boolean(src) && !imageFailed;

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br font-extrabold text-white shadow-sm ring-2 ring-white",
        GRADIENTS[index],
        sizeClass,
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          width={96}
          height={96}
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
