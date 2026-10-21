import type ModelRepository from "@/domain/model/repository";
import type {
  CreateCouncilResponseDTO,
  ICouncilResponse,
} from "@/domain/council/response/entity.ts";
import type CouncilResponseRepository from "@/domain/council/response/repository.ts";
import type { ModelName } from "@/domain/model/entity.ts";

interface LLMResponse {
  prompt: string;
  model: string;
  topic?: string;
  response: string;
}

export default class CouncilResponseService {
  councilResponseRepository: CouncilResponseRepository;
  modelRepository: ModelRepository;

  constructor(
    councilResponseRepository: CouncilResponseRepository,
    modelRepository: ModelRepository,
  ) {
    this.councilResponseRepository = councilResponseRepository;
    this.modelRepository = modelRepository;
  }

  async saveResponses(
    chatId: string,
    userMessageId: string,
    llmResponses: LLMResponse[],
    winnerModel: string,
    votes?: Map<string, number>,
  ): Promise<void> {
    const responseDTOs: CreateCouncilResponseDTO[] = llmResponses.map(
      (llmResponse) => ({
        chat_id: chatId,
        user_message_id: userMessageId,
        model: llmResponse.model,
        provider:
          this.modelRepository.getProviderByModelName(
            llmResponse.model as ModelName,
          ) || "unknown",
        content: llmResponse.response,
        is_winner: llmResponse.model === winnerModel,
        votes_received: votes?.get(llmResponse.model) ?? 0,
      }),
    );

    await this.councilResponseRepository.createMany(responseDTOs);
  }

  async getResponsesForMessage(
    userMessageId: string,
  ): Promise<ICouncilResponse[]> {
    return await this.councilResponseRepository.findByUserMessageId(
      userMessageId,
    );
  }

  async getWinnerResponse(
    userMessageId: string,
  ): Promise<ICouncilResponse | null> {
    return await this.councilResponseRepository.findWinnerByUserMessageId(
      userMessageId,
    );
  }

  async getResponseById(responseId: string): Promise<ICouncilResponse | null> {
    return await this.councilResponseRepository.findById(responseId);
  }

  async markAsWinner(userMessageId: string, winnerId: string): Promise<void> {
    await this.councilResponseRepository.markWinner(userMessageId, winnerId);
  }

  async getResponsesForChat(chatId: string): Promise<ICouncilResponse[]> {
    return await this.councilResponseRepository.findByChatId(chatId);
  }
}
