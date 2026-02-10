import type { AIProvider } from "@/domain/model/entity";
import type UserApiKey from "./entity";

export default interface UserApiKeyRepository {
  getAll: (user_id: string) => Promise<UserApiKey[]>;
  add: (payload: Omit<UserApiKey, "id" | "is_active">) => Promise<UserApiKey>;
  update: (payload: Partial<UserApiKey>) => Promise<UserApiKey>;
  delete: (user_id: string, key_id: string) => Promise<void>;
  findById: (id: string) => Promise<UserApiKey | null>;
  getActiveKeys: (userId: string) => Promise<UserApiKey[] | null>;

  getActiveKeyByProvider: (
    user_id: string,
    provider: AIProvider,
  ) => Promise<UserApiKey | null>;
}
