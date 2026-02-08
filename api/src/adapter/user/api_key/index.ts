import type { AIProvider } from "@/domain/model/entity";
import type UserApiKey from "@/domain/user/api_key/entity";
import type UserApiKeyRepository from "@/domain/user/api_key/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import type { ParamCtx } from "@/infrastructure/utils/add_field";
import addField from "@/infrastructure/utils/add_field";
import { encryptApiKey } from "@/infrastructure/utils/encryption";
import type { Pool } from "pg";

export default class UserApiKeyAdapter implements UserApiKeyRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async getAll(user_id: string): Promise<UserApiKey[]> {
    if (!user_id) {
      throw new BadRequestError("User ID is required");
    }

    const query = `SELECT * FROM user_api_keys WHERE user_id = $1 ORDER BY created_at DESC`;

    const result = await this.pgPool.query<UserApiKey>(query, [user_id]);

    if (result.rows.length < 1) {
      throw new BadRequestError("User not found.");
    }

    return result.rows;
  }

  async add(
    payload: Omit<UserApiKey, "id" | "is_active">,
  ): Promise<UserApiKey> {
    if (!payload.encrypted_key || !payload.user_id || !payload.provider) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `INSERT INTO user_api_keys (user_id, provider, encrypted_key) VALUES ($1, $2, $3) RETURNING *`;

    const values = [
      payload.user_id,
      payload.provider,
      encryptApiKey(payload.encrypted_key),
    ];

    const result = await this.pgPool.query<UserApiKey>(query, values);

    if (!result.rows[0]) {
      throw new Error("Failed to add API Key");
    }

    return result.rows[0];
  }

  async update(payload: Partial<UserApiKey>): Promise<UserApiKey> {
    if (!payload.id || !payload.user_id) {
      throw new BadRequestError("Missing required fields");
    }

    const ctx: ParamCtx = {
      values: [],
      count: 0,
    };

    const setClauses = [
      addField(
        ctx,
        "encrypted_key",
        payload.encrypted_key && encryptApiKey(payload.encrypted_key),
      ),
      addField(ctx, "is_active", payload.is_active),
    ].filter(Boolean);

    if (setClauses.length === 0) {
      throw new BadRequestError("No fields to update");
    }

    ctx.count += 1;
    ctx.values.push(payload.id);

    ctx.values.push(payload.user_id);

    const query = `UPDATE user_api_keys SET ${setClauses.join(", ")} WHERE id = $${ctx.count} AND user_id = $${ctx.count + 1} RETURNING *`;

    const result = await this.pgPool.query<UserApiKey>(query, ctx.values);

    if (!result.rows[0]) {
      throw new Error("API Key not found");
    }

    return result.rows[0];
  }

  async delete(user_id: string, key_id: string): Promise<void> {
    if (!user_id || !key_id) {
      throw new BadRequestError("Missing required fields");
    }

    const query = `DELETE FROM user_api_keys WHERE id = $1 AND user_id = $2`;

    await this.pgPool.query(query, [key_id, user_id]);
  }

  async findById(id: string): Promise<UserApiKey | null> {
    if (!id) {
      throw new BadRequestError("API Key ID is required");
    }

    const query = `SELECT * FROM user_api_keys WHERE id = $1`;

    const result = await this.pgPool.query<UserApiKey>(query, [id]);

    if (result.rows.length < 1) {
      throw new BadRequestError("API Key not found.");
    }

    return result.rows[0] ?? null;
  }

  async getActiveKey(
    userId: string,
    provider: AIProvider,
  ): Promise<UserApiKey | null> {
    const query = `SELECT * FROM user_api_keys 
       WHERE user_id = $1 AND provider = $2 AND is_active = true
       LIMIT 1`;

    const result = await this.pgPool.query<UserApiKey>(query, [
      userId,
      provider,
    ]);

    if (result.rows.length === 0) {
      throw new BadRequestError("No active API key found for this provider");
    }

    return result.rows[0] ?? null;
  }

  async getActiveKeyByProvider(
    user_id: string,
    provider: AIProvider,
  ): Promise<UserApiKey | null> {
    const query = `SELECT * FROM user_api_keys 
       WHERE user_id = $1 AND provider = $2 AND is_active = true
       LIMIT 1`;

    const result = await this.pgPool.query<UserApiKey>(query, [
      user_id,
      provider,
    ]);

    return result.rows[0] ?? null;
  }
}
