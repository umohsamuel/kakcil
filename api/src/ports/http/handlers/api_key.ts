import type Adapter from "@/adapter";
import type { AIProvider } from "@/domain/model/entity";
import type { IUser } from "@/domain/user/entity";
import { SuccessResponse } from "@/infrastructure/responses/success";
import type Services from "@/service";
import { Router, type Request, type Response } from "express";

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

  private getApiKeyById = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const result = await this.adapter.userApiKeyAdapter.findById(id);

    new SuccessResponse(res, result).send();
  };

  private getAllApiKeys = async (req: Request, res: Response) => {
    const user = req.user as IUser;

    const result = await this.adapter.userApiKeyAdapter.getAll(
      user.id as string,
    );

    new SuccessResponse(res, result).send();
  };

  private addApiKey = async (req: Request, res: Response) => {
    const { provider, apiKey } = req.body as {
      provider: AIProvider;
      apiKey: string;
      is_active: boolean;
    };

    const user = req.user as IUser;

    const result = await this.adapter.userApiKeyAdapter.add({
      user_id: user.id as string,
      provider,
      encrypted_key: apiKey,
    });

    new SuccessResponse(res, result).send();
  };

  private updateApiKey = async (req: Request, res: Response) => {
    const { id, is_active, apiKey, provider } = req.body as {
      id: string;
      is_active?: boolean;
      apiKey?: string;
      provider?: AIProvider;
    };

    const user = req.user as IUser;

    const result = await this.adapter.userApiKeyAdapter.update({
      id,
      user_id: user.id as string,
      is_active,
      encrypted_key: apiKey,
      provider,
    });

    new SuccessResponse(res, result).send();
  };

  private deleteApiKey = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const user = req.user as IUser;

    await this.adapter.userApiKeyAdapter.delete(user.id as string, id);

    new SuccessResponse(res, {
      message: "API Key deleted successfully",
    }).send();
  };
}
