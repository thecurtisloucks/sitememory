import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, ScanSearch } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { objectsApi } from "../lib/api";

export function ObjectPage() {
  const { objectId = "" } = useParams();
  const object = useQuery({
    queryKey: ["object", objectId],
    queryFn: () => objectsApi.history(objectId),
  });

  if (object.isLoading)
    return (
      <div className="h-72 animate-pulse rounded-2xl border border-line bg-panel" />
    );
  if (object.isError || !object.data)
    return (
      <p className="text-rose-300">
        {object.error?.message ?? "Object not found"}
      </p>
    );

  return (
    <div>
      <Link
        to={`/rooms/${object.data.roomId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          Persistent object memory
        </p>
        <h1 className="mt-3 text-4xl font-semibold capitalize tracking-tight text-white">
          {object.data.label}
        </h1>
        <p className="mt-3 text-slate-400">{object.data.description}</p>
        <p className="mt-3 text-sm text-slate-600">
          {object.data.observationCount} confirmed observation
          {object.data.observationCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {object.data.observations.map((observation, index) => {
          const box = observation.boundingBox;
          return (
            <Link
              key={observation.id}
              to={`/scans/${observation.scan.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-signal/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={observation.scan.imageUrl}
                  alt={`${object.data.label} observation ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute border-2 border-signal bg-signal/15"
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.width * 100}%`,
                    height: `${box.height * 100}%`,
                  }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={13} />{" "}
                    {new Date(observation.scan.capturedAt).toLocaleString()}
                  </span>
                  <ScanSearch size={15} className="text-signal" />
                </div>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-600">
                  {observation.matchStatus === "NEW"
                    ? "First observed"
                    : `${Math.round((observation.matchingConfidence ?? 0) * 100)}% identity match`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
