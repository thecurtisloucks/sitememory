import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, ScanLine, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { roomsApi } from "../lib/api";

export function RoomPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const room = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => roomsApi.get(roomId),
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
      <section className="mt-10 rounded-2xl border border-dashed border-line bg-panel/60 p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-signal/20 bg-signal/10 text-signal">
          <Camera size={24} />
        </div>
        <h2 className="mt-5 font-semibold text-white">No scans yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Image scanning arrives in Milestone 2. This room is persisted and
          ready for its first observation.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-slate-500">
          <ScanLine size={13} /> SAM 3.1 access validation in progress
        </span>
      </section>
    </div>
  );
}
