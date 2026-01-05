import type {
  AddUserParams,
  IUser,
  UpdateUserParams,
} from "@/domain/user/entity";
import type UserRepository from "@/domain/user/repository";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { NotFoundError } from "@/infrastructure/errors/notFound";
import { encrypt } from "@/infrastructure/utils/encryption";
import type { Pool } from "pg";

export default class UserAdapter implements UserRepository {
  pgPool: Pool;

  constructor(pgPool: Pool) {
    this.pgPool = pgPool;
  }

  async getAll(): Promise<IUser[]> {
    const query = `
    SELECT * FROM users ORDER BY created_at DESC;
  `;

    const result = await this.pgPool.query(query);

    const users = result.rows as IUser[];
    users.forEach((user) => delete user.password);

    return users;
  }

  async findById(id: string): Promise<IUser | null> {
    if (!id) {
      throw new BadRequestError("User ID is required");
    }

    const query = `
    SELECT * FROM users WHERE id = $1;
  `;

    const result = await this.pgPool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result.rows[0] as IUser;
    delete user.password;

    return user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    if (!email) {
      throw new BadRequestError("User email is required");
    }

    const query = `
    SELECT * FROM users WHERE email = $1;
  `;

    const result = await this.pgPool.query(query, [email]);

    if (result.rows.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result.rows[0] as IUser;
    delete user.password;

    return user;
  }

  async add(user: AddUserParams): Promise<IUser> {
    if (!user.name || !user.email || !user.password) {
      throw new BadRequestError("Name, email, and password are required");
    }

    const existingUserQuery = `
    SELECT * FROM users WHERE email = $1;
  `;

    const existingUserResult = await this.pgPool.query(existingUserQuery, [
      user.email,
    ]);

    if (existingUserResult.rows.length > 0) {
      throw new BadRequestError("User already exists");
    }

    const query = `
    INSERT INTO users (name, email, password, is_verified) VALUES ($1, $2, $3, $4) RETURNING *;
  `;

    const encryptedPassword = await encrypt(user.password);

    const result = await this.pgPool.query(query, [
      user.name,
      user.email,
      encryptedPassword,
      false,
    ]);

    const newUser = result.rows[0] as IUser;

    delete newUser.password;

    return newUser;
  }

  async update(user: UpdateUserParams): Promise<IUser> {
    if (!user.id) {
      throw new BadRequestError("User ID is required for update");
    }

    const fields: string[] = [];
    const values: (string | boolean | null)[] = [];
    let index = 1;

    if (user.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(user.name);
    }

    if (user.email !== undefined) {
      const existingUser = await this.findByEmail(user.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestError("Email already exists");
      }
      if (existingUser && existingUser.id === user.id) {
        throw new BadRequestError("Email already exists");
      }

      fields.push(`email = $${index++}`);
      values.push(user.email);
    }

    if (user.password !== undefined) {
      const encryptedPassword = await encrypt(user.password);

      fields.push(`password = $${index++}`);
      values.push(encryptedPassword);
    }

    if (user.is_verified !== undefined) {
      fields.push(`is_verified = $${index++}`);
      values.push(user.is_verified);
    }

    if (fields.length === 0) {
      throw new BadRequestError("At least one field is required to update");
    }

    values.push(user.id);

    const query = `
    UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *;
  `;

    const result = await this.pgPool.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError("User not found for update");
    }

    const updatedUser = result.rows[0] as IUser;
    delete updatedUser.password;

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestError("User ID is required for delete");
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError("User not found for delete");
    }

    const query = `
    DELETE FROM users WHERE id = $1;
  `;

    await this.pgPool.query(query, [id]);
  }
}
