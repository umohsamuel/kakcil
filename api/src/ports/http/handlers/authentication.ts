import { type Request, type Response, Router } from "express";
import type Secrets from "@/infrastructure/secrets";
import type AuthenticationService from "@/service/authentication";
import { AuthorizeRefreshToken } from "../middlewares/authorization";
import {
  generateJWTToken,
  generateRefreshJWTToken,
  verifyToken,
} from "@/infrastructure/utils/encryption";
import {
  SuccessResponse,
  SuccessResponseWithCookies,
} from "@/infrastructure/responses/success";
import type { IUser } from "@/domain/user/entity";
import { ForbiddenError } from "@/infrastructure/errors/forbidden";
import { ApiError } from "@/infrastructure/errors";
import type Adapter from "@/adapter";
import { DEFAULT_COUNCIL_MODELS } from "@/infrastructure/model";

export default class AuthenticationHandler {
  authenticationService: AuthenticationService;
  secrets: Secrets;
  adapter: Adapter;
  router = Router();

  constructor(
    authenticationService: AuthenticationService,
    secrets: Secrets,
    adapter: Adapter,
  ) {
    this.authenticationService = authenticationService;
    this.secrets = secrets;
    this.adapter = adapter;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.post("/register", this.register);
    this.router.post("/login", this.login);

    this.router.post("/forgotPassword", this.forgotPassword);
    this.router.post("/resetPassword", this.resetPassword);

    this.router.get(
      "/token/refresh",
      AuthorizeRefreshToken(this.authenticationService),
      this.generateNewToken,
    );
    this.router.get("/token/clear", this.logout);
  }

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await this.authenticationService.authenticate(email, password);

    const payload: Payload = { id: user.id as string };
    const token = generateJWTToken(payload);
    const refreshToken = generateRefreshJWTToken(payload);

    const cookie: Cookie[] = [
      {
        key: "token",
        value: token,
      },
      {
        key: "refreshToken",
        value: refreshToken,
      },
    ];

    new SuccessResponseWithCookies(res, cookie, {
      token,
      refreshToken,
      user,
    }).send();
  };

  register = async (req: Request, res: Response) => {
    const { email, password, name, is_verified } = req.body;

    const user = await this.authenticationService.register({
      email,
      password,
      name,
      is_verified,
    });

    await this.adapter.councilAdapter.createMany(
      DEFAULT_COUNCIL_MODELS.map((model) => ({
        user_id: user.id as string,
        model_name: model,
        provider: this.adapter.modelAdapter.getProviderByModelName(model)!,
        isActive: true,
      })),
    );

    new SuccessResponse(res, user).send();
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
      const message = await this.authenticationService.forgotPassword(email);

      new SuccessResponse(res, message).send();
    } catch (error) {
      throw new ApiError((error as string) ?? "error sending mail");
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const { password, token } = req.body;

    const jwtPayload = verifyToken(token);
    const payload: Payload = jwtPayload as Payload;

    const user = await this.authenticationService.resetPassword(
      payload.id,
      password,
    );

    new SuccessResponse(res, user).send();
  };

  generateNewToken = async (req: Request, res: Response) => {
    let user = req.user as IUser | null;

    if (!user?.email) {
      throw new ForbiddenError("login again");
    }

    user = await this.authenticationService.userRepository.findByEmail(
      user.email,
    );

    if (!user) {
      throw new ForbiddenError("login again");
    }

    const payload: Payload = { id: user.id as string };
    const token = generateJWTToken(payload);
    const cookie: Cookie[] = [
      {
        key: "token",
        value: token,
      },
    ];
    new SuccessResponseWithCookies(res, cookie, { jwt: token, user }).send();
  };

  logout = async (_req: Request, res: Response) => {
    new SuccessResponseWithCookies(res, [], {
      message: "log out successful",
    }).logout();
  };
}
