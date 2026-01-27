import type ModelRepository from "@/domain/model/repository";
import type {
  CreateCouncilResponseDTO,
  ICouncilResponse,
} from "@/domain/council/response/entity.ts";
import type CouncilResponseRepository from "@/domain/council/response/repository.ts";
import type { ModelName } from "@/domain/model/entity.ts";

interface LLMResponse {
  prompt: string;
  model: ModelName;
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
    llmResponses: (LLMResponse | null)[],
    winnerModel: string,
  ): Promise<ICouncilResponse[]> {
    const responseDTOs: (CreateCouncilResponseDTO | null)[] = llmResponses.map(
      (llmResponse) => {
        if (!llmResponse) return null;

        const provider = this.modelRepository.getProviderByModelName(
          llmResponse.model,
        );

        return {
          chat_id: chatId,
          user_message_id: userMessageId,
          model: llmResponse.model,
          provider: provider || "unknown",
          content: llmResponse.response,
          is_winner: llmResponse.model === winnerModel,
          votes_received: 0,
        };
      },
    );

    await this.councilResponseRepository.createMany(responseDTOs);

    return await this.councilResponseRepository.findByUserMessageId(
      userMessageId,
    );
  }

  async saveResponsesWithVotes(
    chatId: string,
    userMessageId: string,
    responses: Array<{
      model: ModelName;
      content: string;
      votes: number;
    }>,
    winnerModel: string,
  ): Promise<void> {
    const responseDTOs: CreateCouncilResponseDTO[] = responses.map(
      (response) => {
        const provider = this.modelRepository.getProviderByModelName(
          response.model,
        );

        return {
          chat_id: chatId,
          user_message_id: userMessageId,
          model: response.model,
          provider: provider || "unknown",
          content: response.content,
          is_winner: response.model === winnerModel,
          votes_received: response.votes,
        };
      },
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
