import type { IChat, IChatMessage } from "@/domain/chat/entity";
import type ChatRepository from "@/domain/chat/repository.ts";
import type { Pool } from "pg";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import type { PaginationParams } from "@/infrastructure/utils/pagination.ts";
import type { Pagination } from "@/infrastructure/types/pagination.ts";

export default class ChatAdapter implements ChatRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async getAll(
    user_id: string,
    filters: PaginationParams,
  ): Promise<{
    data: IChat[];
    meta: Pagination;
  }> {
    if (!user_id) {
      throw new BadRequestError("User ID is required");
    }

    const count = await this.pgPool.query(
      `SELECT COUNT(*) FROM chats WHERE user_id = $1;`,
      [user_id],
    );

    const totalPages = Math.ceil(parseInt(count.rows[0].count) / filters.limit);

    const query = `
    SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;
  `;

    const result = await this.pgPool.query(query, [
      user_id,
      filters.limit,
      filters.offset,
    ]);

    return {
      data: result.rows as IChat[],
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: result.rows.length,
        totalPages,
      },
    } as {
      data: IChat[];
      meta: Pagination;
    };
  }

  async add(chat: Omit<IChat, "id">): Promise<IChat> {
    if (!chat.user_id || !chat.model) {
      throw new BadRequestError("User ID, model are required");
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (chat.title !== undefined) {
      fields.push(`title`);
      values.push(chat.title);
    }

    if (chat.system_prompt !== undefined) {
      fields.push(`system_prompt`);
      values.push(chat.system_prompt);
    }

    if (fields.length === 0) {
      throw new BadRequestError(
        "At least one field is required to create chat",
      );
    }

    fields.push("user_id");
    values.push(chat.user_id);

    const query = `
    INSERT INTO chats (${fields.join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *; `;

    const result = await this.pgPool.query(query, values);

    return result.rows[0] as IChat;
  }

  async update(chat: Partial<IChat>): Promise<IChat> {
    if (!chat.id) {
      throw new BadRequestError("Chat ID is required for update");
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    let index = 1;

    if (chat.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(chat.title);
    }

    if (chat.system_prompt !== undefined) {
      fields.push(`system_prompt = $${index++}`);
      values.push(chat.system_prompt);
    }

    if (fields.length === 0) {
      throw new BadRequestError(
        "At least one field is required to update chat",
      );
    }

    values.push(chat.id);

    const query = `
    UPDATE chats SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;
  `;

    const result = await this.pgPool.query(query, values);

    if (result.rows.length === 0) {
      throw new BadRequestError("Chat not found for update");
    }

    return result.rows[0] as IChat;
  }

  async delete(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestError("Chat ID is required for delete");
    }

    const query = `
    DELETE FROM chats WHERE id = $1;
    `;

    await this.pgPool.query(query, [id]);
  }

  async getMessages(chat_id: string): Promise<IChatMessage[]> {
    if (!chat_id) {
      throw new BadRequestError("Chat ID is required for get messages");
    }

    const query = `
    SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC;
    `;

    const result = await this.pgPool.query(query, [chat_id]);

    return result.rows as IChatMessage[];
  }

  async addMessage(message: Omit<IChatMessage, "id">): Promise<IChatMessage> {
    if (
      !message.chat_id ||
      !message.user_id ||
      !message.role ||
      !message.content
    ) {
      throw new BadRequestError(
        "Chat ID, user ID, role, and content are required",
      );
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (message.model !== undefined) {
      fields.push(`model`);
      values.push(message.model);
    }

    fields.push("chat_id", "user_id", "role", "content");

    values.push(
      message.chat_id,
      message.user_id,
      message.role,
      message.content,
    );

    const query = `
    INSERT INTO chat_messages 
      (${fields.join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *;`;

    const result = await this.pgPool.query(query, values);

    return result.rows[0] as IChatMessage;
  }
}
