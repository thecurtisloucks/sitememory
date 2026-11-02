import type { AssistantAnswer } from "@sitememory/shared";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bot, ExternalLink, Send, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { assistantApi } from "../lib/api";

const suggestions = [
  "Where did I last see my headphones?",
  "What changed between the two most recent scans?",
  "Which objects are no longer visible?",
];

interface Exchange {
  question: string;
  result: AssistantAnswer;
}

function EvidenceCard({
  evidence,
}: {
  evidence: AssistantAnswer["evidence"][number];
}) {
  const box = evidence.boundingBox;
  return (
    <Link
      to={`/scans/${evidence.scanId}`}
      className="group overflow-hidden rounded-xl border border-line bg-ink/70 transition hover:border-signal/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-black">
        <img
          src={evidence.imageUrl}
          alt={`${evidence.label} supporting observation`}
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
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-medium capitalize text-white">
            {evidence.label}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {new Date(evidence.capturedAt).toLocaleString()}
          </p>
        </div>
        <ExternalLink
          size={14}
          className="text-slate-600 group-hover:text-signal"
        />
      </div>
    </Link>
  );
}

export function AssistantPage() {
  const { roomId = "" } = useParams();
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const ask = useMutation({
    mutationFn: (value: string) => assistantApi.ask(roomId, value),
    onSuccess: (result, askedQuestion) => {
      setExchanges((current) => [
        ...current,
        { question: askedQuestion, result },
      ]);
      setQuestion("");
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = question.trim();
    if (value && !ask.isPending) ask.mutate(value);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={`/rooms/${roomId}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to room
      </Link>
      <div className="border-b border-line pb-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          <Sparkles size={14} /> Evidence-grounded assistant
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
          Ask SiteMemory
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Answers are generated from stored observations and link back to the
          exact images used as evidence.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {exchanges.length === 0 ? (
          <section className="rounded-2xl border border-line bg-panel p-6">
            <div className="flex items-center gap-3 text-white">
              <span className="rounded-xl bg-signal/10 p-2 text-signal">
                <Bot size={20} />
              </span>
              <h2 className="font-semibold">Try a question</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setQuestion(suggestion)}
                  className="rounded-full border border-line bg-ink px-4 py-2 text-left text-sm text-slate-300 transition hover:border-signal/40 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {exchanges.map((exchange, exchangeIndex) => (
          <div
            key={`${exchange.question}-${exchangeIndex}`}
            className="space-y-3"
          >
            <div className="ml-auto max-w-2xl rounded-2xl rounded-br-md bg-slate-800 px-5 py-4 text-sm text-slate-200">
              {exchange.question}
            </div>
            <section className="max-w-4xl rounded-2xl rounded-tl-md border border-line bg-panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Bot size={17} className="text-signal" /> SiteMemory
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    exchange.result.provider === "meta"
                      ? "bg-signal/10 text-signal"
                      : "bg-violet-400/10 text-violet-200"
                  }`}
                >
                  {exchange.result.provider === "meta" ? "LIVE MUSE" : "MOCK"}
                </span>
              </div>
              <p className="mt-4 leading-7 text-slate-300">
                {exchange.result.answer}
              </p>
              {exchange.result.uncertaintyNotes.length ? (
                <div className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  {exchange.result.uncertaintyNotes.join(" ")}
                </div>
              ) : null}
              {exchange.result.evidence.length ? (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Supporting visual evidence
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {exchange.result.evidence.map((evidence) => (
                      <EvidenceCard
                        key={evidence.observationId}
                        evidence={evidence}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-4 mt-8 flex gap-3 rounded-2xl border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur"
      >
        <input
          value={question}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about an object, scan, or change…"
          aria-label="Question for SiteMemory"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600"
        />
        <Button type="submit" disabled={!question.trim() || ask.isPending}>
          <Send size={16} /> {ask.isPending ? "Thinking…" : "Ask"}
        </Button>
      </form>
      {ask.error ? (
        <p className="mt-3 text-sm text-rose-300">{ask.error.message}</p>
      ) : null}
    </div>
  );
}
