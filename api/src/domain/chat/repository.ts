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

  getById: (id: string, user_id: string) => Promise<IChat | null>;

  add: (chat: Omit<IChat, "id">) => Promise<IChat>;

  update: (chat: Partial<IChat>) => Promise<IChat>;

  touch: (id: string) => Promise<void>;

  delete: (id: string, user_id: string) => Promise<void>;

  getMessages: (
    chat_id: string,
    limit?: number,
    offset?: number,
    branch_id?: string,
  ) => Promise<
    (IChatMessage & {
      branch_id: string | null;
      response_model: string | null;
      response_provider: string | null;
      is_winner: boolean | null;
    })[]
  >;

  getMessageById: (id: string, chat_id: string) => Promise<IChatMessage | null>;

  getAllMessages: (chat_id: string) => Promise<IChatMessage[]>;

  getThreadMessages: (
    chat_id: string,
    branch_id: string | null,
    until?: Date,
  ) => Promise<IChatMessage[]>;

  addMessage: (message: Omit<IChatMessage, "id">) => Promise<IChatMessage>;
}
