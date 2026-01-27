import type { IChatBranch } from "@/domain/chat/branch/entity.ts";

export default interface ChatBranchRepository {
  createChatBranch(
    chatBranch: Omit<IChatBranch, "id" | "created_at">,
  ): Promise<IChatBranch>;

  getChatBranchById(id: string): Promise<IChatBranch | null>;

  getChatBranchesByChatId(chatId: string): Promise<IChatBranch[]>;

  updateChatBranch(
    id: string,
    updates: Partial<Omit<IChatBranch, "id" | "chat_id" | "created_at">>,
  ): Promise<IChatBranch>;

  deleteChatBranch(id: string): Promise<void>;
}
