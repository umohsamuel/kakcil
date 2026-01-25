import type { AIProvider, ModelName } from "@/domain/model/entity.ts";

export interface CouncilMember {
  id: string;
  user_id: string;
  model_name: ModelName;
  provider: AIProvider;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCouncilMemberDTO {
  user_id: string;
  model_name: ModelName;
  provider: AIProvider;
  is_active?: boolean;
}
