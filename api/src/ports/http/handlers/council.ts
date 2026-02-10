import { type Request, type Response, Router } from "express";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import type { ModelName } from "@/domain/model/entity.ts";
import { SuccessResponse } from "@/infrastructure/responses/success.ts";
import type Services from "@/service";
import type Adapter from "@/adapter";

export default class CouncilHandler {
  services: Services;
  adapter: Adapter;
  router = Router();

  constructor(services: Services, adapter: Adapter) {
    this.services = services;
    this.adapter = adapter;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.get("/", this.getAllModels);
    this.router.get("/user", this.getUserCouncilMembers);
    this.router.post("/update", this.updateCouncilMembers);
    this.router.delete("/clearAll", this.clearCouncil);
  }

  private getAllModels = async (req: Request, res: Response) => {
    const members = await this.services.councilService.listCouncilModels();

    return new SuccessResponse(res, members).send();
  };

  private getUserCouncilMembers = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    const members =
      await this.services.councilService.getUserCouncilMembers(id);

    return new SuccessResponse(res, members).send();
  };

  private updateCouncilMembers = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    const { members } = req.body as { members: ModelName[] };

    console.log("request members object ", members);

    const activeByokKeys =
      await this.adapter.userApiKeyAdapter.getActiveKeys(id);

    if (activeByokKeys) {
      const updateProviders = new Set(
        members
          .map((m) =>
            this.services.councilService.modelRepository.getProviderByModelName(
              m,
            ),
          )
          .filter((provider) => provider != null),
      );

      const activeByokKeyProviders = new Set(
        activeByokKeys.map((k) => k.provider),
      );

      const unauthorizedProviders = [...updateProviders].filter(
        (provider) => !activeByokKeyProviders.has(provider),
      );

      if (unauthorizedProviders.length > 0) {
        throw new BadRequestError(
          `Cannot use models from providers [${unauthorizedProviders.join(", ")}] that do not belong to your API key providers. Active providers: [${[...activeByokKeyProviders].join(", ")}]`,
        );
      }
    }

    if (!Array.isArray(members) || members.length === 0) {
      throw new BadRequestError("Members are is required");
    }

    try {
      await this.services.councilService.updateUserCouncil(id, members);
    } catch (error) {
      throw new BadRequestError(error as string);
    }

    return new SuccessResponse(res, {
      message: "Council members updated successfully",
    }).send();
  };

  private clearCouncil = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    await this.services.councilService.clearCouncil(id);

    return new SuccessResponse(res, {
      message: "All council members cleared successfully",
    }).send();
  };
}
