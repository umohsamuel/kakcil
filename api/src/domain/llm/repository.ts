import type {
  TextGenerationRequest,
  TextGenerationResponse,
  VoteRequest,
} from "./entity";
import { type ModelMessage, Output } from "ai";
import type { LMMScore } from "@/infrastructure/utils/vote.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";

export default interface LLMRepository {
  generateText<T = string>(
    request: TextGenerationRequest,
    output?: Output.Output<T>,
    messageHistory?: ModelMessage[],
  ): Promise<TextGenerationResponse<T>>;

  vote(
    request: VoteRequest,
    llmResponses: (TextGenerationResponse | null)[],
    councilMembers: CouncilMember[],
  ): Promise<(LMMScore | null)[]>;
}
