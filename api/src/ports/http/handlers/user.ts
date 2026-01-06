import type { AddUserParams, UpdateUserParams } from "@/domain/user/entity";
import { SuccessResponse } from "@/infrastructure/responses/success";
import type UserService from "@/service/user";
import { type Request, type Response, Router } from "express";

export default class UserHandler {
  router = Router();
  userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
    this.configureRoutes();
  }

  configureRoutes() {
    this.router.get("/", this.getAll);
    this.router.post("/", this.create);
    this.router.get("/id/:id", this.findByID);
    this.router.get("/email/:email", this.findByEmail);
    this.router.patch("/update", this.update);
    this.router.delete("/delete/:id", this.delete);
  }

  create = async (req: Request, res: Response) => {
    const { name, email, password, is_verified } = req.body as AddUserParams;

    const user = await this.userService.createUser({
      name,
      email,
      password,
      is_verified,
    });

    new SuccessResponse(res, { user }).send();
  };

  findByEmail = async (req: Request, res: Response) => {
    const email = req.params.email as string;

    const user = await this.userService.getUserByEmail(email);

    if (user) {
      delete user.password;
    }

    new SuccessResponse(res, { user }).send();
  };

  findByID = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const user = await this.userService.getUserById(id);

    if (user) {
      delete user.password;
    }

    new SuccessResponse(res, { user }).send();
  };

  getAll = async (_req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();

    new SuccessResponse(res, { users }).send();
  };

  update = async (req: Request, res: Response) => {
    const { id, name, email, password, is_verified } =
      req.body as UpdateUserParams;

    const user = await this.userService.updateUser(id!, {
      name,
      email,
      password,
      is_verified,
    });

    new SuccessResponse(res, { user }).send();
  };

  delete = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await this.userService.deleteUser(id);

    new SuccessResponse(res, {
      message: "user deleted successfully",
    }).send();
  };
}
