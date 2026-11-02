import type { AssistantEvidence, ComparisonChange } from "@sitememory/shared";

export interface ReasoningInput {
  roomName: string;
  question: string;
  evidence: AssistantEvidence[];
  changes: ComparisonChange[];
}

export interface ReasoningResult {
  provider: "mock" | "meta";
  answer: string;
  rawResponse?: unknown;
}

export interface ReasoningProvider {
  readonly name: "mock" | "meta";
  answerQuestion(input: ReasoningInput): Promise<ReasoningResult>;
}
