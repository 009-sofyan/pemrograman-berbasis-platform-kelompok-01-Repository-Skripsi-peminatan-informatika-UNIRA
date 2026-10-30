import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { initials } from "../../lib/format";

const GRADIENTS = [
  "from-primary-500 to-violet-500",
  "from-sky-500 to-cyan-400",
  "from-mint-500 to-emerald-400",
  "from-amber-500 to-orange-400",
  "from-coral-500 to-rose-400",
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
    md: "size-10 rounded-xl text-xs",
    lg: "size-14 rounded-2xl text-base",
    xl: "size-24 rounded-[1.75rem] text-2xl",
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
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
