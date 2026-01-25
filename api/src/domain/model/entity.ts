import { MODEL_CONFIGS } from "@/infrastructure/model";

export type AIProvider = keyof typeof MODEL_CONFIGS;
export type ModelName = (typeof MODEL_CONFIGS)[AIProvider][number];

export const AI_PROVIDERS = Object.keys(MODEL_CONFIGS) as readonly AIProvider[];

export interface IModel<P extends AIProvider = AIProvider> {
  name: (typeof MODEL_CONFIGS)[P][number];
  provider: P;
  description?: string;
}
