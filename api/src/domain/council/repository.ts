import type {
  CouncilMember,
  CreateCouncilMemberDTO,
} from "@/domain/council/entity.ts";
import type { AIProvider, ModelName } from "@/domain/model/entity.ts";

export default interface CouncilRepository {
  findMembersByUserId(user_id: string): Promise<CouncilMember[]>;

  create(payload: CreateCouncilMemberDTO): Promise<CouncilMember>;

  createMany(members: CreateCouncilMemberDTO[]): Promise<void>;

  deactivateAll(user_id: string): Promise<void>;

  deactivateByModelName(user_id: string, model_name: ModelName): Promise<void>;

  upsert(payload: Partial<CreateCouncilMemberDTO>): Promise<CouncilMember>;
}
