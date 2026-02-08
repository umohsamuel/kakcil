import type { Pool } from "pg";
import type ChatBranchRepository from "@/domain/chat/branch/repository.ts";
import type { IChatBranch } from "@/domain/chat/branch/entity.ts";
import { BadRequestError } from "@/infrastructure/errors/badRequest";

export default class ChatBranchAdapter implements ChatBranchRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async createChatBranch(
    chatBranch: Omit<IChatBranch, "id" | "created_at">,
  ): Promise<IChatBranch> {
    const fields: string[] = ["chat_id"];
    const values: unknown[] = [chatBranch.chat_id];

    if (
      chatBranch.branch_name !== undefined &&
      chatBranch.branch_name !== null
    ) {
      fields.push("branch_name");
      values.push(chatBranch.branch_name);
    }

    if (
      chatBranch.branched_from_message_id !== undefined &&
      chatBranch.branched_from_message_id !== null
    ) {
      fields.push("branched_from_message_id");
      values.push(chatBranch.branched_from_message_id);
    }

    if (
      chatBranch.branched_from_response_id !== undefined &&
      chatBranch.branched_from_response_id !== null
    ) {
      fields.push("branched_from_response_id");
      values.push(chatBranch.branched_from_response_id);
    }

    if (chatBranch.is_main_branch !== undefined) {
      fields.push("is_main_branch");
      values.push(chatBranch.is_main_branch);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const query = `
      INSERT INTO chat_branches 
        (${fields.join(", ")}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

    const result = await this.pgPool.query<IChatBranch>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new Error("Failed to create chat branch");
    }

    return result.rows[0];
  }

  async getChatBranchById(id: string): Promise<IChatBranch | null> {
    const query = `
      SELECT * FROM chat_branches
      WHERE id = $1
    `;

    const result = await this.pgPool.query<IChatBranch>(query, [id]);
    return result.rows[0] || null;
  }

  async getChatBranchesByChatId(chatId: string): Promise<IChatBranch[]> {
    const query = `
      SELECT * FROM chat_branches
      WHERE chat_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pgPool.query<IChatBranch>(query, [chatId]);
    return result.rows;
  }

  async updateChatBranch(
    id: string,
    updates: Partial<Omit<IChatBranch, "id" | "chat_id" | "created_at">>,
  ): Promise<IChatBranch> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    // Build dynamic SET clause
    if (updates.branch_name !== undefined) {
      setClauses.push(`branch_name = $${paramCount}`);
      values.push(updates.branch_name);
      paramCount++;
    }

    if (updates.branched_from_message_id !== undefined) {
      setClauses.push(`branched_from_message_id = $${paramCount}`);
      values.push(updates.branched_from_message_id);
      paramCount++;
    }

    if (updates.branched_from_response_id !== undefined) {
      setClauses.push(`branched_from_response_id = $${paramCount}`);
      values.push(updates.branched_from_response_id);
      paramCount++;
    }

    if (updates.is_main_branch !== undefined) {
      setClauses.push(`is_main_branch = $${paramCount}`);
      values.push(updates.is_main_branch);
      paramCount++;
    }

    if (setClauses.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);

    const query = `
      UPDATE chat_branches 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.pgPool.query<IChatBranch>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new Error("Chat branch not found or failed to update");
    }

    return result.rows[0];
  }

  async deleteChatBranch(id: string, user_id: string): Promise<void> {
    if (!id || !user_id) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `
      DELETE FROM chat_branches
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.pgPool.query(query, [id, user_id]);

    if (result.rowCount === 0) {
      throw new BadRequestError("Chat branch not found");
    }
  }

  async getMainBranch(chatId: string): Promise<IChatBranch | null> {
    const query = `
      SELECT * FROM chat_branches
      WHERE chat_id = $1 AND is_main_branch = TRUE
      LIMIT 1
    `;

    const result = await this.pgPool.query<IChatBranch>(query, [chatId]);
    return result.rows[0] || null;
  }

  async setMainBranch(branchId: string, chatId: string): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE chat_branches 
         SET is_main_branch = FALSE 
         WHERE chat_id = $1`,
        [chatId],
      );

      await client.query(
        `UPDATE chat_branches 
         SET is_main_branch = TRUE 
         WHERE id = $1 AND chat_id = $2`,
        [branchId, chatId],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getBranchWithMessages(branchId: string): Promise<{
    branch: IChatBranch;
    messageCount: number;
  } | null> {
    const query = `
      SELECT 
        b.*,
        COUNT(m.id) as message_count
      FROM chat_branches b
      LEFT JOIN chat_messages m ON m.branch_id = b.id
      WHERE b.id = $1
      GROUP BY b.id
    `;

    const result = await this.pgPool.query(query, [branchId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      branch: {
        id: row.id,
        chat_id: row.chat_id,
        branch_name: row.branch_name,
        branched_from_message_id: row.branched_from_message_id,
        branched_from_response_id: row.branched_from_response_id,
        is_main_branch: row.is_main_branch,
        created_at: row.created_at,
      },
      messageCount: parseInt(row.message_count),
    };
  }

  async deleteBranchWithMessages(
    branchId: string,
    user_id: string,
  ): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM chat_messages WHERE branch_id = $1 AND user_id = $2`,
        [branchId, user_id],
      );

      await client.query(`DELETE FROM chat_branches WHERE id = $1`, [branchId]);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
