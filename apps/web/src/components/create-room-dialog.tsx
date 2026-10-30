import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { roomsApi } from "../lib/api";
import { Button } from "./ui/button";

export function CreateRoomDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createRoom = useMutation({
    mutationFn: roomsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createRoom.mutate({
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? "") || undefined,
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          className={compact ? "h-10 w-10 p-0 sm:w-auto sm:px-4" : undefined}
        >
          <Plus size={17} />{" "}
          <span className={compact ? "hidden sm:inline" : undefined}>
            New room
          </span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-panel p-6 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-xl font-semibold text-white">
                Create a room
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-400">
                Start a persistent memory for a physical space.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" aria-label="Close">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-200">
              Room name
              <input
                autoFocus
                required
                maxLength={80}
                name="name"
                placeholder="Home office"
                className="mt-2 w-full rounded-xl border border-line bg-ink px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-signal/60 focus:ring-2 focus:ring-signal/10"
              />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Description{" "}
              <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                maxLength={500}
                name="description"
                rows={3}
                placeholder="The upstairs workspace and desk"
                className="mt-2 w-full resize-none rounded-xl border border-line bg-ink px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-signal/60 focus:ring-2 focus:ring-signal/10"
              />
            </label>
            {createRoom.error ? (
              <p
                role="alert"
                className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
              >
                {createRoom.error.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending ? "Creating…" : "Create room"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
