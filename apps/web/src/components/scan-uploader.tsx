import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Upload } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { scansApi } from "../lib/api";

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 10 * 1024 * 1024;

export function ScanUploader({ roomId }: { roomId: string }) {
  const cameraId = useId();
  const libraryId = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: (file: File) => scansApi.upload(roomId, file),
    onSuccess: async (scan) => {
      await queryClient.invalidateQueries({ queryKey: ["scans", roomId] });
      navigate(`/scans/${scan.id}`);
    },
  });

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!supportedTypes.has(file.type)) {
      setValidationError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxBytes) {
      setValidationError("Images must be 10 MB or smaller.");
      return;
    }
    setValidationError(null);
    upload.mutate(file);
  }

  return (
    <section className="rounded-2xl border border-line bg-panel p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-signal/20 bg-signal/10 text-signal">
          <ImagePlus size={21} />
        </div>
        <div>
          <h2 className="font-semibold text-white">Add an observation</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Photograph the room from a similar position each time for stronger
            comparisons.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          id={cameraId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={selectFile}
          disabled={upload.isPending}
        />
        <label
          htmlFor={cameraId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-ink transition hover:bg-emerald-200"
        >
          <Camera size={17} /> Take photo
        </label>
        <input
          id={libraryId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={selectFile}
          disabled={upload.isPending}
        />
        <label
          htmlFor={libraryId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <Upload size={17} /> Choose image
        </label>
      </div>
      {upload.isPending ? (
        <p className="mt-4 text-sm text-signal">Uploading image securely…</p>
      ) : null}
      {validationError || upload.error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300"
        >
          {validationError ?? upload.error?.message}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-slate-600">
        JPEG, PNG, or WebP · maximum 10 MB · AI processing begins only when you
        choose Analyze
      </p>
    </section>
  );
}
