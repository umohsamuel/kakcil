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
    this.router.get("/", this.getAllCouncilMembers);
    this.router.post("/update", this.updateCouncilMembers);
  }

  private getAllCouncilMembers = async (req: Request, res: Response) => {
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
}
