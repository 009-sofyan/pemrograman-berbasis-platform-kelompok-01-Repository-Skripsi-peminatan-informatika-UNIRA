import { BrainCircuit, Sprout } from "lucide-react";
import { Badge } from "./Badge";
import { getPeminatanMeta } from "../../constants";
import type { PeminatanValue } from "../../types";

export function PeminatanBadge({
  value,
  size = "sm",
  short = false,
  withIcon = true,
}: {
  value: PeminatanValue;
  size?: "xs" | "sm" | "md";
  short?: boolean;
  withIcon?: boolean;
}) {
  const meta = getPeminatanMeta(value);
  const Icon = value === "Business Intelligence" ? BrainCircuit : value === "Smart Agriculture" ? Sprout : null;
  return (
    <Badge
      tone={meta.tone}
      size={size}
      title={meta.label}
      className="max-w-full"
    >
      {withIcon && Icon ? <Icon className="size-3" /> : null}
      <span className="truncate">{short ? meta.short : meta.label}</span>
    </Badge>
  );
}
