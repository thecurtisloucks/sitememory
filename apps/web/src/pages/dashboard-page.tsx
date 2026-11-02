import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Camera, Clock3, Layers3, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateRoomDialog } from "../components/create-room-dialog";
import { roomsApi } from "../lib/api";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

export function DashboardPage() {
  const rooms = useQuery({ queryKey: ["rooms"], queryFn: roomsApi.list });

  return (
    <div>
      <section className="mb-12 grid gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-signal">
            <ScanLine size={15} /> Spatial intelligence workspace
          </p>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl">
            Give every space a memory.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Record physical environments, understand what changed, and retrieve
            the evidence behind every answer.
          </p>
        </div>
        <div className="hidden lg:block">
          <CreateRoomDialog />
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Your rooms</h2>
          <p className="mt-1 text-sm text-slate-500">
            Persistent spaces and their observation history
          </p>
        </div>
        {rooms.data?.length ? (
          <span className="text-sm text-slate-500">
            {rooms.data.length} total
          </span>
        ) : null}
      </div>

      {rooms.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-2xl border border-line bg-panel"
            />
          ))}
        </div>
      ) : rooms.isError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <p className="font-medium text-rose-200">
            Couldn’t reach the SiteMemory API
          </p>
          <p className="mt-2 text-sm text-rose-300/70">{rooms.error.message}</p>
        </div>
      ) : rooms.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.data.map((room, index) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:-translate-y-0.5 hover:border-signal/30 hover:shadow-glow"
            >
              <div className="relative h-28 overflow-hidden border-b border-line bg-[#0c1118]">
                {room.latestScan ? (
                  <img
                    src={room.latestScan.imageUrl}
                    alt="Latest room scan"
                    className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(110,231,199,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(110,231,199,.05)_1px,transparent_1px)] [background-size:24px_24px]" />
                )}
                <div className="absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-xl border border-signal/20 bg-signal/10 text-signal">
                  {index % 2 ? <Layers3 size={21} /> : <Camera size={21} />}
                </div>
                <ArrowUpRight
                  className="absolute right-5 top-5 text-slate-600 transition group-hover:text-signal"
                  size={19}
                />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-white">{room.name}</h3>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                  {room.description || "Ready for its first observation."}
                </p>
                <p className="mt-5 flex items-center gap-2 text-xs text-slate-600">
                  <Clock3 size={13} /> Updated{" "}
                  {dateFormatter.format(new Date(room.updatedAt))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-panel/60 px-6 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-signal/20 bg-signal/10 text-signal">
            <Layers3 size={25} />
          </div>
          <h3 className="mt-5 font-semibold text-white">
            Create your first room
          </h3>
          <p className="mx-auto mb-6 mt-2 max-w-sm text-sm leading-6 text-slate-500">
            A room is the home for scans, object observations, comparisons, and
            evidence-backed answers.
          </p>
          <CreateRoomDialog />
        </div>
      )}
    </div>
  );
}
