import type Adapter from "@/adapter";
import { AI_PROVIDERS, type AIProvider } from "@/domain/model/entity";
import type UserApiKey from "@/domain/user/api_key/entity";
import type { IUser } from "@/domain/user/entity";
import { BadRequestError } from "@/infrastructure/errors/badRequest";
import { NotFoundError } from "@/infrastructure/errors/notFound";
import { SuccessResponse } from "@/infrastructure/responses/success";
import { decryptApiKey } from "@/infrastructure/utils/encryption";
import { DEFAULT_MODEL_BY_PROVIDER } from "@/infrastructure/model";
import type Services from "@/service";
import { Router, type Request, type Response } from "express";

const toPublicKey = (key: UserApiKey) => {
  const { encrypted_key, ...rest } = key;
  const plain = decryptApiKey(encrypted_key);

  return {
    ...rest,
    key_hint: plain.length > 4 ? plain.slice(-4) : "",
  };
};

export default class ApiKeyHandler {
  adapter: Adapter;
  services: Services;

  router = Router();

  constructor(adapter: Adapter, services: Services) {
    this.adapter = adapter;
    this.services = services;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.get("/", this.getAllApiKeys);
    this.router.get("/:id", this.getApiKeyById);
    this.router.post("/", this.addApiKey);
    this.router.patch("/update", this.updateApiKey);
    this.router.delete("/:id", this.deleteApiKey);
  }

  private getOwnedKey = async (user_id: string, id: string) => {
    const keys = await this.adapter.userApiKeyAdapter
      .getAll(user_id)
      .catch(() => [] as UserApiKey[]);
    const key = keys.find((k) => k.id === id);

    if (!key) {
      throw new NotFoundError("API key not found");
    }

    return key;
  };

  private getApiKeyById = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const user = req.user as IUser;

    const key = await this.getOwnedKey(user.id as string, id);

    new SuccessResponse(res, toPublicKey(key)).send();
  };

  private getAllApiKeys = async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const keys = await this.adapter.userApiKeyAdapter
      .getAll(user.id as string)
      .catch(() => [] as UserApiKey[]);

    new SuccessResponse(res, keys.map(toPublicKey)).send();
  };

  private addApiKey = async (req: Request, res: Response) => {
    const { provider, apiKey } = req.body as {
      provider: AIProvider;
      apiKey: string;
    };

    const user = req.user as IUser;

    if (!AI_PROVIDERS.includes(provider)) {
      throw new BadRequestError("Choose a supported provider");
    }

    if (typeof apiKey !== "string" || !apiKey.trim()) {
      throw new BadRequestError("API key is required");
    }

    const existing =
      await this.adapter.userApiKeyAdapter.getActiveKeyByProvider(
        user.id as string,
        provider,
      );

    if (existing) {
      throw new BadRequestError(
        `You already have an active ${provider} key. Replace or remove it first.`,
      );
    }

    const result = await this.adapter.userApiKeyAdapter.add({
      user_id: user.id as string,
      provider,
      encrypted_key: apiKey.trim(),
    });

    await this.updateModelConfig(user);
    await this.ensureProviderInCouncil(user.id as string, provider);

    new SuccessResponse(res, toPublicKey(result)).send();
  };

  private ensureProviderInCouncil = async (
    user_id: string,
    provider: AIProvider,
  ) => {
    const members =
      await this.services.councilService.getUserCouncilMembers(user_id);

    if (members.some((member) => member.provider === provider)) {
      return;
    }

    await this.services.councilService.addCouncilMember(
      user_id,
      DEFAULT_MODEL_BY_PROVIDER[provider],
    );
  };

  private updateApiKey = async (req: Request, res: Response) => {
    const { id, is_active, apiKey } = req.body as {
      id: string;
      is_active?: boolean;
      apiKey?: string;
    };

    const user = req.user as IUser;

    const result = await this.adapter.userApiKeyAdapter.update({
      id,
      user_id: user.id as string,
      is_active,
      encrypted_key: apiKey?.trim() || undefined,
    });

    await this.updateModelConfig(user);

    new SuccessResponse(res, toPublicKey(result)).send();
  };

  private deleteApiKey = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const user = req.user as IUser;

    await this.adapter.userApiKeyAdapter.delete(user.id as string, id);

    await this.updateModelConfig(user);

    new SuccessResponse(res, {
      message: "API Key deleted successfully",
    }).send();
  };

  private updateModelConfig = async (user: IUser) => {
    const activeByokKeys =
      (await this.adapter.userApiKeyAdapter.getActiveKeys(user.id as string)) ??
      [];

    const userCouncilMembers =
      await this.services.councilService.getUserCouncilMembers(
        user.id as string,
      );

    const activeByokKeyProviders = new Set(
      activeByokKeys.map((k) => k.provider),
    );

    const unauthorizedProviders = new Set(
      userCouncilMembers
        .map((m) => m.provider)
        .filter((provider) => !activeByokKeyProviders.has(provider)),
    );

    for (const provider of unauthorizedProviders) {
      await this.adapter.councilAdapter.deactivateAllInProvider(
        user.id as string,
        provider,
      );
    }
  };
}
