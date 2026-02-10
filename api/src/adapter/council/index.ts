import type {
  CouncilMember,
  CreateCouncilMemberDTO,
} from "@/domain/council/entity";
import type CouncilRepository from "@/domain/council/repository.ts";
import type { AIProvider, ModelName } from "@/domain/model/entity";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import type { Pool } from "pg";

export default class CouncilAdapter implements CouncilRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async findMembersByUserId(userId: string): Promise<CouncilMember[]> {
    const query = `
      SELECT * FROM council_members
      WHERE user_id = $1 AND is_active = TRUE
      ORDER BY created_at ASC
    `;

    const result = await this.pgPool.query<CouncilMember>(query, [userId]);
    return result.rows;
  }

  async create(payload: CreateCouncilMemberDTO): Promise<CouncilMember> {
    const query = `
      INSERT INTO council_members (user_id, model_name, provider, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        *`;

    const values = [
      payload.user_id,
      payload.model_name,
      payload.provider,
      payload.is_active ?? true,
    ];

    const result = await this.pgPool.query<CouncilMember>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new BadRequestError("Failed to create council member");
    }

    return result.rows[0];
  }

  async createMany(members: CreateCouncilMemberDTO[]): Promise<void> {
    if (members.length === 0) {
      throw new BadRequestError("At least one council member is required");
    }

    const client = await this.pgPool.connect();
    try {
      await client.query("BEGIN");

      for (const member of members) {
        await client.query(
          `INSERT INTO council_members (user_id, model_name, provider, is_active)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, model_name) DO NOTHING`,
          [
            member.user_id,
            member.model_name,
            member.provider,
            member.is_active ?? true,
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

  async deactivateAll(userId: string): Promise<void> {
    const query = `
      UPDATE council_members
      SET is_active = FALSE
      WHERE user_id = $1
    `;

    await this.pgPool.query(query, [userId]);
  }

  async deactivateAllInProvider(
    userId: string,
    provider: AIProvider,
  ): Promise<void> {
    const query = `
      UPDATE council_members
      SET is_active = FALSE
      WHERE user_id = $1 AND provider = $2
    `;

    await this.pgPool.query(query, [userId, provider]);
  }

  async deactivateByModelName(
    userId: string,
    modelName: ModelName,
  ): Promise<void> {
    const query = `
      UPDATE council_members
      SET is_active = FALSE
      WHERE user_id = $1 AND model_name = $2
    `;

    await this.pgPool.query(query, [userId, modelName]);
  }

  async upsert(data: CreateCouncilMemberDTO): Promise<CouncilMember> {
    const query = `
      INSERT INTO council_members (user_id, model_name, provider, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, model_name) 
      DO UPDATE SET 
        is_active = EXCLUDED.is_active
      RETURNING *
    `;

    const values = [
      data.user_id,
      data.model_name,
      data.provider,
      data.is_active ?? true,
    ];

    const result = await this.pgPool.query<CouncilMember>(query, values);

    if (result.rows.length === 0 || !result.rows[0]) {
      throw new BadRequestError("Failed to upsert council member");
    }

    return result.rows[0];
  }
}
