import type {
  TextGenerationRequest,
  TextGenerationResponse,
  VoteRequest,
} from "./entity";
import { type ModelMessage, Output } from "ai";
import type { LMMScore } from "@/infrastructure/utils/vote.ts";

export default interface LLMRepository {
  generateText<T = string>(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>>;

  streamText(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    signal?: AbortSignal,
  ): AsyncGenerator<string>;

  vote(
    request: VoteRequest,
    llmResponses: (TextGenerationResponse | null)[],
    useFastModel?: boolean,
  ): Promise<(LMMScore | null)[]>;
}
