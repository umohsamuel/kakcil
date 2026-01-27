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

  async getMessages(
    chat_id: string,
    limit: number = 50,
    offset: number = 0,
    branch_id?: string,
  ): Promise<IChatMessage[]> {
    if (!chat_id) {
      throw new BadRequestError("Chat ID is required for get messages");
    }

    const query = `
      SELECT
        m.*,
        cr.model as response_model,
        cr.provider as response_provider,
        cr.is_winner
      FROM chat_messages m
             LEFT JOIN council_responses cr ON m.branch_from_response_id = cr.id
      WHERE m.chat_id = $1
        AND ($2::uuid IS NULL OR m.branch_id = $2)
        AND m.is_active_branch = TRUE
      ORDER BY m.created_at ASC
        LIMIT $3 OFFSET $4
    `;

    const result = await this.pgPool.query(query, [
      chat_id,
      branch_id,
      limit,
      offset,
    ]);

    return result.rows as IChatMessage[];
  }

  async getAllMessages(
    chat_id: string,
    branch_id?: string | null,
  ): Promise<IChatMessage[]> {
    const query = `
    SELECT * 
    FROM chat_messages
    WHERE chat_id = $1
      AND ($2::uuid IS NULL OR branch_id = $2)
      AND is_active_branch = TRUE
    ORDER BY created_at ASC
  `;

    const result = await this.pgPool.query<IChatMessage>(query, [
      chat_id,
      branch_id || null,
    ]);

    return result.rows;
  }

  async getRecentMessages(
    chatId: string,
    branchId: string | null,
    limit: number = 50,
  ): Promise<IChatMessage[]> {
    const query = `
    SELECT * 
    FROM chat_messages
    WHERE chat_id = $1
      AND ($2::uuid IS NULL OR branch_id = $2)
      AND is_active_branch = TRUE
    ORDER BY created_at DESC
    LIMIT $3
  `;

    const result = await this.pgPool.query<IChatMessage>(query, [
      chatId,
      branchId || null,
      limit,
    ]);

    // Reverse to get chronological order
    return result.rows.reverse();
  }

  async addMessage(message: Omit<IChatMessage, "id">): Promise<IChatMessage> {
    if (!message.chat_id || !message.role || !message.content) {
      throw new BadRequestError(
        "Chat ID, user ID, role, and content are required",
      );
    }

    const fields: string[] = ["chat_id", "role", "content"];
    const values: unknown[] = [message.chat_id, message.role, message.content];

    if (message.user_id !== undefined && message.user_id !== null) {
      fields.push("user_id");
      values.push(message.user_id);
    }

    if (message.model !== undefined && message.model !== null) {
      fields.push("model");
      values.push(message.model);
    }

    if (
      message.parent_message_id !== undefined &&
      message.parent_message_id !== null
    ) {
      fields.push("parent_message_id");
      values.push(message.parent_message_id);
    }

    if (
      message.branch_from_response_id !== undefined &&
      message.branch_from_response_id !== null
    ) {
      fields.push("branch_from_response_id");
      values.push(message.branch_from_response_id);
    }

    if (message.branch_id !== undefined && message.branch_id !== null) {
      fields.push("branch_id");
      values.push(message.branch_id);
    }

    if (message.is_active_branch !== undefined) {
      fields.push("is_active_branch");
      values.push(message.is_active_branch);
    }

    const query = `
    INSERT INTO chat_messages 
      (${fields.join(", ")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *;`;

    const result = await this.pgPool.query(query, values);

    return result.rows[0] as IChatMessage;
  }
}
