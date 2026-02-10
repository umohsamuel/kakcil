import type {
  CreateCouncilResponseDTO,
  ICouncilResponse,
} from "@/domain/council/response/entity.ts";
import type CouncilResponseRepository from "@/domain/council/response/repository.ts";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import type { Pool } from "pg";

export default class CouncilResponseAdapter implements CouncilResponseRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async create(response: CreateCouncilResponseDTO): Promise<ICouncilResponse> {
    const query = `
      INSERT INTO council_responses 
        (chat_id, user_message_id, model, provider, content, is_winner, votes_received)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      response.chat_id,
      response.user_message_id,
      response.model,
      response.provider,
      response.content,
      response.is_winner ?? false,
      response.votes_received ?? 0,
    ];

    const result = await this.pgPool.query<ICouncilResponse>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new BadRequestError("Failed to create council response");
    }

    return result.rows[0];
  }

  async createMany(
    responses: (CreateCouncilResponseDTO | null)[],
  ): Promise<void> {
    if (responses.length === 0) return;

    const client = await this.pgPool.connect();
    try {
      await client.query("BEGIN");

      for (const response of responses) {
        if (response === null) continue;

        await client.query(
          `INSERT INTO council_responses 
           (chat_id, user_message_id, model, provider, content, is_winner, votes_received)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            response.chat_id,
            response.user_message_id,
            response.model,
            response.provider,
            response.content,
            response.is_winner ?? false,
            response.votes_received ?? 0,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<ICouncilResponse | null> {
    const query = `
      SELECT * FROM council_responses
      WHERE id = $1
    `;

    const result = await this.pgPool.query<ICouncilResponse>(query, [id]);
    return result.rows[0] || null;
  }

  async findByUserMessageId(
    userMessageId: string,
  ): Promise<ICouncilResponse[]> {
    const query = `
      SELECT * FROM council_responses
      WHERE user_message_id = $1
      ORDER BY 
        is_winner DESC,
        votes_received DESC,
        created_at ASC
    `;

    const result = await this.pgPool.query<ICouncilResponse>(query, [
      userMessageId,
    ]);
    return result.rows;
  }

  async findByChatId(chatId: string): Promise<ICouncilResponse[]> {
    const query = `
      SELECT * FROM council_responses
      WHERE chat_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pgPool.query<ICouncilResponse>(query, [chatId]);
    return result.rows;
  }

  async markWinner(userMessageId: string, winnerId: string): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query("BEGIN");

      // Unmark all as winners for this user message
      await client.query(
        `UPDATE council_responses 
         SET is_winner = FALSE 
         WHERE user_message_id = $1`,
        [userMessageId],
      );

      // Mark the winner
      await client.query(
        `UPDATE council_responses 
         SET is_winner = TRUE 
         WHERE id = $1 AND user_message_id = $2`,
        [winnerId, userMessageId],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findWinnerByUserMessageId(
    userMessageId: string,
  ): Promise<ICouncilResponse | null> {
    const query = `
      SELECT * FROM council_responses
      WHERE user_message_id = $1 AND is_winner = TRUE
      LIMIT 1
    `;

    const result = await this.pgPool.query<ICouncilResponse>(query, [
      userMessageId,
    ]);
    return result.rows[0] || null;
  }

  async updateVotes(responseId: string, votes: number): Promise<void> {
    const query = `
      UPDATE council_responses
      SET votes_received = $1
      WHERE id = $2
    `;

    await this.pgPool.query(query, [votes, responseId]);
  }

  async deleteByUserMessageId(userMessageId: string): Promise<void> {
    const query = `
      DELETE FROM council_responses
      WHERE user_message_id = $1
    `;

    await this.pgPool.query(query, [userMessageId]);
  }
}
