import type { AIProvider } from "@/domain/model/entity";

export default interface UserApiKey {
  id: string;
  user_id: string;
  provider: AIProvider;
  encrypted_key: string;
  is_active: boolean;
}
