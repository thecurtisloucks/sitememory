import type { ObjectObservation } from "@sitememory/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BrainCircuit,
  RefreshCw,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ScanOverlay } from "../components/scan-overlay";
import { ScanStatusBadge } from "../components/scan-status";
import { Button } from "../components/ui/button";
import { scansApi } from "../lib/api";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ScanPage() {
  const { scanId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ObjectObservation | null>(null);
  const scan = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => scansApi.get(scanId),
    refetchInterval: (query) =>
      query.state.data?.status === "PROCESSING" ? 1000 : false,
  });
  const processScan = useMutation({
    mutationFn: () => scansApi.process(scanId),
    onSuccess: async (processed) => {
      queryClient.setQueryData(["scan", scanId], processed);
      await queryClient.invalidateQueries({
        queryKey: ["scans", processed.roomId],
      });
      setSelected(processed.observations[0] ?? null);
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
    },
  });

  if (scan.isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-line bg-panel" />
    );
  }
  if (scan.isError || !scan.data) {
    return (
      <p className="text-rose-300">{scan.error?.message ?? "Scan not found"}</p>
    );
  }

  const data = scan.data;
  const active =
    data.observations.find((item) => item.id === selected?.id) ??
    data.observations[0] ??
    null;
  const isProcessing = processScan.isPending || data.status === "PROCESSING";

  return (
    <div>
      <Link
        to={`/rooms/${data.roomId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="mb-8 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ScanStatusBadge
              status={isProcessing ? "PROCESSING" : data.status}
            />
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                data.provider === "meta"
                  ? "bg-signal/10 text-signal"
                  : "bg-violet-400/10 text-violet-200"
              }`}
            >
              {data.provider === "meta" ? "Live Meta inference" : "Mock data"}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Scan observation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {dateFormatter.format(new Date(data.capturedAt))} · {data.width}×
            {data.height}
          </p>
        </div>
        <Button disabled={isProcessing} onClick={() => processScan.mutate()}>
          {isProcessing ? (
            <RefreshCw size={17} className="animate-spin" />
          ) : (
            <Sparkles size={17} />
          )}
          {isProcessing
            ? "Analyzing…"
            : data.status === "COMPLETED"
              ? "Analyze again"
              : data.status === "FAILED"
                ? "Retry analysis"
                : "Analyze with AI"}
        </Button>
      </div>

      {data.status === "FAILED" || processScan.error ? (
        <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
          {processScan.error?.message ??
            data.errorMessage ??
            "Processing failed."}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ScanOverlay
          scan={data}
          selectedId={active?.id}
          onSelect={setSelected}
        />
        <aside className="rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Detected objects</h2>
            <span className="text-xs text-slate-500">
              {data.observations.length}
            </span>
          </div>
          {active ? (
            <div className="mt-5">
              <div className="rounded-xl border border-signal/20 bg-signal/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">
                  Selected
                </p>
                <h3 className="mt-2 font-semibold capitalize text-white">
                  {active.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {active.description}
                </p>
                {active.confidence !== null ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Model confidence {(active.confidence * 100).toFixed(1)}%
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-600">
                    No confidence provided
                  </p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {data.observations.map((observation) => (
                  <button
                    type="button"
                    key={observation.id}
                    onClick={() => setSelected(observation)}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-ink/60 px-3 py-3 text-left text-sm text-slate-300 transition hover:border-signal/30 hover:text-white"
                  >
                    <span className="capitalize">{observation.label}</span>
                    <ScanSearch size={15} className="text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-10 text-center">
              <BrainCircuit className="mx-auto text-slate-700" size={30} />
              <p className="mt-3 text-sm text-slate-500">
                {isProcessing
                  ? "The model is looking for objects…"
                  : data.status === "COMPLETED"
                    ? "No supported objects were detected."
                    : "Run analysis to detect and segment objects."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
