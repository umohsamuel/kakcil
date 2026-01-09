import type {
  TextGenerationRequest,
  TextGenerationResponse,
  VoteRequest,
} from "./entity";

export default interface LLMRepository {
  generateText(
    request: TextGenerationRequest,
    useFastModel?: boolean,
  ): Promise<TextGenerationResponse>;

  streamText(
    request: TextGenerationRequest,
    useFastModel?: boolean,
    signal?: AbortSignal,
  ): AsyncGenerator<string>;

  vote(request: VoteRequest[]): Promise<TextGenerationResponse>;
}
