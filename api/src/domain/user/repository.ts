import type { AddUserParams, IUser, UpdateUserParams } from "./entity";

export default interface UserRepository {
  getAll: () => Promise<IUser[]>;
  add: (user: AddUserParams) => Promise<IUser>;
  update: (user: UpdateUserParams) => Promise<IUser>;
  delete: (id: string) => Promise<void>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
}
