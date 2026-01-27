import type { ICouncilResponse, CreateCouncilResponseDTO } from "./entity";

export default interface CouncilResponseRepository {
  create(response: CreateCouncilResponseDTO): Promise<ICouncilResponse>;

  createMany(responses: (CreateCouncilResponseDTO | null)[]): Promise<void>;

  findById(id: string): Promise<ICouncilResponse | null>;

  findByUserMessageId(userMessageId: string): Promise<ICouncilResponse[]>;

  findByChatId(chatId: string): Promise<ICouncilResponse[]>;

  markWinner(userMessageId: string, winnerId: string): Promise<void>;

  findWinnerByUserMessageId(
    userMessageId: string,
  ): Promise<ICouncilResponse | null>;

  updateVotes(responseId: string, votes: number): Promise<void>;

  deleteByUserMessageId(userMessageId: string): Promise<void>;
}
