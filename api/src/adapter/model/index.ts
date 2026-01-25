import type ModelRepository from "@/domain/model/repository.ts";
import {
  type AIProvider,
  type IModel,
  type ModelName,
} from "@/domain/model/entity.ts";
import { MODEL_CONFIGS, MODEL_DESCRIPTIONS } from "@/infrastructure/model";

export default class ModelAdapter implements ModelRepository {
  getProviderByModelName(model_name: ModelName): AIProvider | null {
    for (const [provider, models] of Object.entries(MODEL_CONFIGS)) {
      if (models.includes(model_name as never)) {
        return provider as AIProvider;
      }
    }
    return null;
  }

  getModelByName(model_name: ModelName): IModel | null {
    const provider = this.getProviderByModelName(model_name);
    if (!provider) return null;

    return {
      name: model_name,
      provider,
      description: MODEL_DESCRIPTIONS[model_name],
    };
  }

  getModelsByProvider<P extends AIProvider>(provider: P): IModel<P>[] {
    return MODEL_CONFIGS[provider].map((name) => ({
      name,
      provider,
      description: MODEL_DESCRIPTIONS[name],
    }));
  }

  getAllModels(): IModel[] {
    const models: IModel[] = [];

    for (const [provider, model_name] of Object.entries(MODEL_CONFIGS)) {
      model_name.forEach((name) => {
        models.push({
          name: name as ModelName,
          provider: provider as AIProvider,
          description: MODEL_DESCRIPTIONS[name as ModelName],
        });
      });
    }

    return models;
  }

  getAllModelNames(): ModelName[] {
    return Object.values(MODEL_CONFIGS).flat() as ModelName[];
  }

  isValidModel(model_name: string): model_name is ModelName {
    return this.getAllModelNames().includes(model_name as ModelName);
  }
}
