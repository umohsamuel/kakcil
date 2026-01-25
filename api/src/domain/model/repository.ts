import {
  type AIProvider,
  type IModel,
  type ModelName,
} from "@/domain/model/entity.ts";

export default interface ModelRepository {
  getProviderByModelName(model_name: ModelName): AIProvider | null;
  getModelByName(model_name: ModelName): IModel | null;
  getModelsByProvider<P extends AIProvider>(provider: P): IModel<P>[];
  getAllModels(): IModel[];
  isValidModel(model_name: string): model_name is ModelName;
  getAllModelNames(): ModelName[];
}
