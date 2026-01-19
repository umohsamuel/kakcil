import type { IChat, IChatMessage } from "@/domain/chat/entity.ts";

export default interface ChatRepository {
  getAll: (user_id: string) => Promise<IChat[]>;
  add: (chat: Omit<IChat, "id">) => Promise<IChat>;
  update: (chat: Partial<IChat>) => Promise<IChat>;
  delete: (id: string) => Promise<void>;
  getMessages: (chat_id: string) => Promise<IChatMessage[]>;
  addMessage: (message: Omit<IChatMessage, "id">) => Promise<IChatMessage>;
}
