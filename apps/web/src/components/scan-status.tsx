import type { ScanStatus } from "@sitememory/shared";
import {
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { cn } from "../lib/utils";

const statusConfig = {
  PENDING: {
    label: "Ready to process",
    icon: CircleDashed,
    className: "text-amber-200 bg-amber-400/10",
  },
  PROCESSING: {
    label: "Processing",
    icon: LoaderCircle,
    className: "text-sky-200 bg-sky-400/10",
  },
  COMPLETED: {
    label: "Complete",
    icon: CheckCircle2,
    className: "text-signal bg-signal/10",
  },
  FAILED: {
    label: "Needs attention",
    icon: TriangleAlert,
    className: "text-rose-200 bg-rose-400/10",
  },
} satisfies Record<
  ScanStatus,
  { label: string; icon: typeof CircleDashed; className: string }
>;

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
      )}
    >
      <Icon
        size={13}
        className={status === "PROCESSING" ? "animate-spin" : undefined}
      />
      {config.label}
    </span>
  );
}
