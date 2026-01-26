import type CouncilService from "@/service/council";
import { type Request, type Response, Router } from "express";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import type { ModelName } from "@/domain/model/entity.ts";
import { SuccessResponse } from "@/infrastructure/responses/success.ts";

export default class CouncilHandler {
  councilService: CouncilService;
  router = Router();

  constructor(councilService: CouncilService) {
    this.councilService = councilService;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.get("/", this.getAllModels);
    this.router.get("/user", this.getUserCouncilMembers);
    this.router.post("/update", this.updateCouncilMembers);
    this.router.delete("/clearAll", this.clearCouncil);
  }

  private getAllModels = async (req: Request, res: Response) => {
    const members = await this.councilService.listCouncilModels();

    return new SuccessResponse(res, members).send();
  };

  private getUserCouncilMembers = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    const members = await this.councilService.getUserCouncilMembers(id);

    return new SuccessResponse(res, members).send();
  };

  private updateCouncilMembers = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    const { members } = req.body as { members: ModelName[] };

    console.log("request members object ", members);

    if (!Array.isArray(members) || members.length === 0) {
      throw new BadRequestError("Members are is required");
    }

    try {
      await this.councilService.updateUserCouncil(id, members);
    } catch (error) {
      throw new BadRequestError(error as string);
    }

    return new SuccessResponse(res, {
      message: "Council members updated successfully",
    }).send();
  };

  private clearCouncil = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };

    await this.councilService.clearCouncil(id);

    return new SuccessResponse(res, {
      message: "All council members cleared successfully",
    }).send();
  };
}
