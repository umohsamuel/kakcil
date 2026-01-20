import type { IChat, IChatMessage } from "@/domain/chat/entity.ts";
import type { PaginationParams } from "@/infrastructure/utils/pagination.ts";
import type { Pagination } from "@/infrastructure/types/pagination.ts";

export default interface ChatRepository {
  getAll: (
    user_id: string,
    filters: PaginationParams,
  ) => Promise<{
    data: IChat[];
    meta: Pagination;
  }>;
  add: (chat: Omit<IChat, "id">) => Promise<IChat>;
  update: (chat: Partial<IChat>) => Promise<IChat>;
  delete: (id: string) => Promise<void>;
  getMessages: (chat_id: string) => Promise<IChatMessage[]>;
  addMessage: (message: Omit<IChatMessage, "id">) => Promise<IChatMessage>;
}
