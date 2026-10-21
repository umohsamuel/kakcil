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

    const total = parseInt(count.rows[0].count);
    const totalPages = Math.ceil(total / filters.limit);

    const query = `
    SELECT * FROM chats WHERE user_id = $1 ORDER BY COALESCE(last_message_at, created_at) DESC LIMIT $2 OFFSET $3;
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
        total,
        totalPages,
      },
    } as {
      data: IChat[];
      meta: Pagination;
    };
  }

  async getById(id: string, user_id: string): Promise<IChat | null> {
    const result = await this.pgPool.query<IChat>(
      `SELECT * FROM chats WHERE id = $1 AND user_id = $2;`,
      [id, user_id],
    );

    return result.rows[0] ?? null;
  }

  async touch(id: string): Promise<void> {
    await this.pgPool.query(
      `UPDATE chats SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1;`,
      [id],
    );
  }

  async add(chat: Omit<IChat, "id">): Promise<IChat> {
    if (!chat.user_id) {
      throw new BadRequestError("User ID is required");
    }

    const fields: string[] = [];
    const values: unknown[] = [];

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
    if (!chat.id || !chat.user_id) {
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
    values.push(chat.user_id);

    const query = `
    UPDATE chats SET ${fields.join(", ")} WHERE id = $${index} AND user_id = $${index + 1} RETURNING *;
  `;

    const result = await this.pgPool.query(query, values);

    if (result.rows.length === 0) {
      throw new BadRequestError("Chat not found for update");
    }

    return result.rows[0] as IChat;
  }

  async delete(id: string, user_id: string): Promise<void> {
    if (!id || !user_id) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `
    DELETE FROM chats WHERE id = $1 AND user_id = $2;
    `;

    await this.pgPool.query(query, [id, user_id]);
  }

  async getMessages(
    chat_id: string,
    limit: number = 50,
    offset: number = 0,
    branch_id?: string,
  ): Promise<
    (IChatMessage & {
      branch_id: string | null;
      response_model: string | null;
      response_provider: string | null;
      is_winner: boolean | null;
    })[]
  > {
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
        AND m.branch_id IS NOT DISTINCT FROM $2::uuid
        AND m.is_active_branch = TRUE
      ORDER BY m.created_at ASC
        LIMIT $3 OFFSET $4
    `;

    const result = await this.pgPool.query(query, [
      chat_id,
      branch_id ?? null,
      limit,
      offset,
    ]);

    return result.rows as (IChatMessage & {
      branch_id: string | null;
      response_model: string | null;
      response_provider: string | null;
      is_winner: boolean | null;
    })[];
  }

  async getMessageById(
    id: string,
    chat_id: string,
  ): Promise<IChatMessage | null> {
    const result = await this.pgPool.query<IChatMessage>(
      `SELECT * FROM chat_messages WHERE id = $1 AND chat_id = $2;`,
      [id, chat_id],
    );

    return result.rows[0] ?? null;
  }

  async getAllMessages(chat_id: string): Promise<IChatMessage[]> {
    const result = await this.pgPool.query<IChatMessage>(
      `SELECT * FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC;`,
      [chat_id],
    );

    return result.rows;
  }

  async getThreadMessages(
    chat_id: string,
    branch_id: string | null,
    until?: Date,
  ): Promise<IChatMessage[]> {
    const query = `
    SELECT m.*
    FROM chat_messages m
    WHERE m.chat_id = $1
      AND m.branch_id IS NOT DISTINCT FROM $2::uuid
      AND m.is_active_branch = TRUE
      AND ($3::timestamptz IS NULL OR m.created_at <= $3::timestamptz)
      AND NOT (m.role = 'assistant' AND m.branch_from_response_id IS NOT NULL)
      AND NOT (
        m.role = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM chat_messages a
          WHERE a.parent_message_id = m.id
            AND a.role = 'assistant'
            AND a.branch_id IS NOT DISTINCT FROM m.branch_id
        )
      )
    ORDER BY m.created_at ASC
  `;

    const result = await this.pgPool.query<IChatMessage>(query, [
      chat_id,
      branch_id,
      until ?? null,
    ]);

    return result.rows;
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
