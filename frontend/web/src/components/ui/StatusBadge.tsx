import { Badge } from "./Badge";
import { STATUS_META } from "../../constants";
import type { SkripsiStatus } from "../../types";

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: SkripsiStatus;
  size?: "xs" | "sm" | "md";
}) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} size={size} dot title={meta.description}>
      {meta.label}
    </Badge>
  );
}
