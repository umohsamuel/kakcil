import type { AIProvider, ModelName } from "@/domain/model/entity.ts";
import type CouncilRepository from "@/domain/council/repository.ts";
import {
  DEFAULT_COUNCIL_MODELS,
  MODEL_CONFIGS,
  MODEL_DESCRIPTIONS,
} from "@/infrastructure/model";
import type {
  CouncilMember,
  CreateCouncilMemberDTO,
} from "@/domain/council/entity.ts";
import type ModelRepository from "@/domain/model/repository.ts";
import { BadRequestError } from "@/infrastructure/errors/badRequest";

export default class CouncilService {
  councilRepository: CouncilRepository;
  modelRepository: ModelRepository;

  constructor(
    councilRepository: CouncilRepository,
    modelRepository: ModelRepository,
  ) {
    this.councilRepository = councilRepository;
    this.modelRepository = modelRepository;
  }

  listCouncilModels(): Array<{
    model_name: ModelName;
    provider: AIProvider | null;
    description: string;
  }> {
    const allModels = Object.values(MODEL_CONFIGS).flat();

    return allModels.map((model_name) => ({
      model_name,
      provider: this.modelRepository.getProviderByModelName(model_name)!,
      description: MODEL_DESCRIPTIONS[model_name],
    }));
  }

  async initializeDefaultCouncil(user_id: string): Promise<void> {
    const defaultMembers: CreateCouncilMemberDTO[] = DEFAULT_COUNCIL_MODELS.map(
      (model_name) => ({
        user_id,
        model_name,
        provider: this.modelRepository.getProviderByModelName(model_name)!,
        is_active: true,
      }),
    );

    await this.councilRepository.createMany(defaultMembers);
  }

  async getUserCouncilMembers(user_id: string): Promise<CouncilMember[]> {
    let members = await this.councilRepository.findMembersByUserId(user_id);

    if (members.length === 0) {
      await this.initializeDefaultCouncil(user_id);
      members = await this.councilRepository.findMembersByUserId(user_id);
    }

    return members;
  }

  async updateUserCouncil(
    user_id: string,
    modelNames: ModelName[],
  ): Promise<void> {
    await this.councilRepository.deactivateAll(user_id);

    for (let i = 0; i < modelNames.length; i++) {
      const model_name = modelNames[i];

      if (!model_name) {
        throw new BadRequestError("Model name cannot be empty");
      }

      const provider = this.modelRepository.getProviderByModelName(model_name);

      if (!provider) {
        throw new BadRequestError(`Invalid model: ${model_name}`);
      }

      await this.councilRepository.upsert({
        user_id,
        model_name,
        provider,
        is_active: true,
      });
    }
  }

  async addCouncilMember(
    user_id: string,
    model_name: ModelName,
  ): Promise<void> {
    const provider = this.modelRepository.getProviderByModelName(model_name);
    if (!provider) {
      throw new BadRequestError(`Invalid model: ${model_name}`);
    }

    await this.councilRepository.upsert({
      user_id,
      model_name,
      provider,
      is_active: true,
    });
  }

  async removeCouncilMember(
    userId: string,
    modelName: ModelName,
  ): Promise<void> {
    await this.councilRepository.deactivateByModelName(userId, modelName);
  }

  async resetToDefaults(userId: string): Promise<void> {
    await this.councilRepository.deactivateAll(userId);
    await this.initializeDefaultCouncil(userId);
  }

  async clearCouncil(userId: string): Promise<void> {
    await this.councilRepository.deactivateAll(userId);
  }
}
