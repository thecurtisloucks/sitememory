import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, ScanLine, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScanStatusBadge } from "../components/scan-status";
import { ScanUploader } from "../components/scan-uploader";
import { Button } from "../components/ui/button";
import { roomsApi, scansApi } from "../lib/api";

export function RoomPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const room = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => roomsApi.get(roomId),
  });
  const scans = useQuery({
    queryKey: ["scans", roomId],
    queryFn: () => scansApi.list(roomId),
  });
  const deleteRoom = useMutation({
    mutationFn: () => roomsApi.delete(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/");
    },
  });

  if (room.isLoading)
    return (
      <div className="h-56 animate-pulse rounded-2xl border border-line bg-panel" />
    );
  if (room.isError)
    return <p className="text-rose-300">{room.error.message}</p>;

  return (
    <div>
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft size={16} /> All rooms
      </Link>
      <div className="flex flex-col gap-6 border-b border-line pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            Room memory
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {room.data?.name}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            {room.data?.description || "No description added."}
          </p>
        </div>
        <Button
          variant="danger"
          disabled={deleteRoom.isPending}
          onClick={() =>
            window.confirm("Delete this room? This cannot be undone.") &&
            deleteRoom.mutate()
          }
        >
          <Trash2 size={16} />{" "}
          {deleteRoom.isPending ? "Deleting…" : "Delete room"}
        </Button>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <ScanUploader roomId={roomId} />
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Scan history</h2>
              <p className="mt-1 text-sm text-slate-500">
                Every observation remains available as evidence.
              </p>
            </div>
            <span className="text-sm text-slate-600">
              {scans.data?.length ?? 0} total
            </span>
          </div>
          {scans.isLoading ? (
            <div className="h-52 animate-pulse rounded-2xl border border-line bg-panel" />
          ) : scans.isError ? (
            <p className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-300">
              {scans.error.message}
            </p>
          ) : scans.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {scans.data.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/scans/${scan.id}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-signal/30"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-black">
                    <img
                      src={scan.imageUrl}
                      alt="Room observation"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <ScanStatusBadge status={scan.status} />
                      <span
                        className={
                          scan.provider === "meta"
                            ? "text-xs font-medium text-signal"
                            : "text-xs font-medium text-violet-300"
                        }
                      >
                        {scan.provider === "meta" ? "LIVE" : "MOCK"}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Clock3 size={13} />{" "}
                      {new Date(scan.capturedAt).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {scan.observations.length} object
                      {scan.observations.length === 1 ? "" : "s"} detected
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-panel/60 p-10 text-center">
              <ScanLine className="mx-auto text-slate-700" size={28} />
              <h3 className="mt-4 font-semibold text-white">No scans yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Take a photo or choose an image to start this room’s visual
                history.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
