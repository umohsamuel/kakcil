import type {
  TextGenerationRequest,
  TextGenerationResponse,
  VoteRequest,
} from "./entity";
import { type ModelMessage, Output } from "ai";
import type { LMMScore } from "@/infrastructure/utils/vote.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";

export default interface LLMRepository {
  streamText<T = string>(
    request: TextGenerationRequest,
    user_id: string,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
    onChunk?: (partial: { text?: string; output?: T }) => void,
  ): Promise<TextGenerationResponse<T> | undefined>;

  generateText<T = string>(
    request: TextGenerationRequest,
    user_id: string,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>>;

  vote(
    request: VoteRequest,
    user_id: string,
    llmResponses: TextGenerationResponse[],
    councilMembers: CouncilMember[],
  ): Promise<(LMMScore | null)[]>;
}
