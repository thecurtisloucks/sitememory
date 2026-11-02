import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Settings2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { roomsApi } from "../lib/api";
import { Button } from "./ui/button";

const validPrompt = /^[\p{L}\p{N}][\p{L}\p{N} '&-]*$/u;

export function TrackingPromptEditor({
  roomId,
  initialPrompts,
}: {
  roomId: string;
  initialPrompts: string[];
}) {
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => roomsApi.update(roomId, { objectPrompts: prompts }),
    onSuccess: async (room) => {
      queryClient.setQueryData(["room", roomId], room);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  function addPrompt(event: FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (value.length > 40 || !validPrompt.test(value)) {
      setError(
        "Use a short object name without punctuation (40 characters max). ",
      );
      return;
    }
    if (
      prompts.some((prompt) => prompt.toLowerCase() === value.toLowerCase())
    ) {
      setError("That object is already tracked.");
      return;
    }
    if (prompts.length >= 12) {
      setError("A room can track up to 12 object types.");
      return;
    }
    setPrompts((current) => [...current, value]);
    setDraft("");
    setError(null);
    save.reset();
  }

  function removePrompt(prompt: string) {
    if (prompts.length === 1) {
      setError("Track at least one object.");
      return;
    }
    setPrompts((current) => current.filter((item) => item !== prompt));
    setError(null);
    save.reset();
  }

  const changed = JSON.stringify(prompts) !== JSON.stringify(initialPrompts);

  return (
    <section className="mt-8 rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal/10 text-signal">
            <Settings2 size={18} />
          </span>
          <div>
            <h2 className="font-semibold text-white">Objects to track</h2>
            <p className="mt-1 text-sm text-slate-500">
              Future analyses ask SAM for these room-specific object types.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          disabled={!changed || save.isPending}
          onClick={() => save.mutate()}
        >
          <Save size={15} /> {save.isPending ? "Saving…" : "Save tracking list"}
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <span
            key={prompt}
            className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-signal/5 py-1.5 pl-3 pr-1.5 text-sm capitalize text-slate-200"
          >
            {prompt}
            <button
              type="button"
              onClick={() => removePrompt(prompt)}
              aria-label={`Stop tracking ${prompt}`}
              className="rounded-full p-1 text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={addPrompt} className="mt-4 flex max-w-lg gap-2">
        <input
          value={draft}
          maxLength={40}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add keys, drill, medication…"
          aria-label="Object type to track"
          className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-signal/60"
        />
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>
          <Plus size={15} /> Add
        </Button>
      </form>
      {error || save.error ? (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error ?? save.error?.message}
        </p>
      ) : save.isSuccess && !changed ? (
        <p className="mt-3 text-sm text-signal">
          Tracking list saved. It will apply to the next analysis.
        </p>
      ) : null}
    </section>
  );
}
