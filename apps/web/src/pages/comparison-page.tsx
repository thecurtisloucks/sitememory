import type { ChangeClassification, ScanComparison } from "@sitememory/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScanOverlay } from "../components/scan-overlay";
import { Button } from "../components/ui/button";
import { comparisonsApi, scansApi } from "../lib/api";

const changeStyles: Record<ChangeClassification, string> = {
  UNCHANGED: "bg-slate-400/10 text-slate-300",
  MOVED: "bg-amber-400/10 text-amber-200",
  NEWLY_VISIBLE: "bg-signal/10 text-signal",
  NO_LONGER_VISIBLE: "bg-rose-400/10 text-rose-200",
  UNCERTAIN: "bg-violet-400/10 text-violet-200",
};

function ComparisonResult({ comparison }: { comparison: ScanComparison }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Earlier scan
          </p>
          <ScanOverlay scan={comparison.sourceScan} onSelect={() => {}} />
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Newer scan
          </p>
          <ScanOverlay scan={comparison.targetScan} onSelect={() => {}} />
        </div>
      </div>
      <section className="mt-8 rounded-2xl border border-line bg-panel p-5 sm:p-6">
        <h2 className="font-semibold text-white">Detected changes</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {comparison.changes.map((change, index) => (
            <div
              key={`${change.sourceObservationId}-${change.targetObservationId}-${index}`}
              className="rounded-xl border border-line bg-ink/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold capitalize text-white">
                  {change.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${changeStyles[change.classification]}`}
                >
                  {change.classification.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {change.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ComparisonBuilderPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const scans = useQuery({
    queryKey: ["scans", roomId],
    queryFn: () => scansApi.list(roomId),
  });
  const completed =
    scans.data?.filter((scan) => scan.status === "COMPLETED") ?? [];
  const sourceId = source || completed[1]?.id || "";
  const targetId = target || completed[0]?.id || "";
  const compare = useMutation({
    mutationFn: () => comparisonsApi.create(roomId, sourceId, targetId),
    onSuccess: (result) => navigate(`/comparisons/${result.id}`),
  });

  return (
    <div>
      <Link
        to={`/rooms/${roomId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          Temporal comparison
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Compare room scans
        </h1>
        <p className="mt-3 text-slate-400">
          Choose an earlier and newer observation. SiteMemory will distinguish
          movement from visibility changes without claiming an unseen object was
          removed.
        </p>
      </div>
      <section className="mt-8 rounded-2xl border border-line bg-panel p-6">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
          <label className="text-sm font-medium text-slate-300">
            Earlier scan
            <select
              value={sourceId}
              onChange={(event) => setSource(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-line bg-ink px-3 py-3 text-white"
            >
              {completed.map((scan) => (
                <option key={scan.id} value={scan.id}>
                  {new Date(scan.capturedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <ArrowRight
            className="mb-3 hidden text-slate-600 md:block"
            size={20}
          />
          <label className="text-sm font-medium text-slate-300">
            Newer scan
            <select
              value={targetId}
              onChange={(event) => setTarget(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-line bg-ink px-3 py-3 text-white"
            >
              {completed.map((scan) => (
                <option key={scan.id} value={scan.id}>
                  {new Date(scan.capturedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={
              completed.length < 2 || sourceId === targetId || compare.isPending
            }
            onClick={() => compare.mutate()}
          >
            <GitCompareArrows size={17} />{" "}
            {compare.isPending ? "Comparing…" : "Compare"}
          </Button>
        </div>
        {completed.length < 2 ? (
          <p className="mt-4 text-sm text-amber-200">
            Process at least two scans before comparing.
          </p>
        ) : null}
        {compare.error ? (
          <p className="mt-4 text-sm text-rose-300">{compare.error.message}</p>
        ) : null}
      </section>
    </div>
  );
}

export function ComparisonResultPage() {
  const { comparisonId = "" } = useParams();
  const comparison = useQuery({
    queryKey: ["comparison", comparisonId],
    queryFn: () => comparisonsApi.get(comparisonId),
  });
  if (comparison.isLoading)
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-line bg-panel" />
    );
  if (comparison.isError || !comparison.data)
    return (
      <p className="text-rose-300">
        {comparison.error?.message ?? "Comparison not found"}
      </p>
    );
  return (
    <div>
      <Link
        to={`/rooms/${comparison.data.roomId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="mb-8 border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          Comparison evidence
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          What changed?
        </h1>
      </div>
      <ComparisonResult comparison={comparison.data} />
    </div>
  );
}
