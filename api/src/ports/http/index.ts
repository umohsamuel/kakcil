import express, { type Express } from "express";
import { StatusCodes } from "http-status-codes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import MorganMiddleware from "./middlewares/morgan";
import Route404 from "./middlewares/invalidRoute";
import ErrorHandlerMiddleware from "./middlewares/errorHandler";
import type Secrets from "@/infrastructure/secrets";
import type Adapter from "@/adapter";
import { corsOptions } from "@/infrastructure/utils/cors";
import UserHandler from "./handlers/user";
import type Services from "@/service";
import AuthenticationHandler from "./handlers/authentication";
import { Authorize } from "./middlewares/authorization";
import ChatHandler from "./handlers/chat";
import CouncilHandler from "@/ports/http/handlers/council.ts";
import ApiKeyHandler from "./handlers/api_key";
import SubscriptionHandler from "./handlers/subscription";
import WebhookHandler from "./handlers/webhook/paystack";

export default class ExpressHTTP {
  secrets: Secrets;
  services: Services;
  adapter: Adapter;
  server: Express;

  router = express.Router();

  constructor(secrets: Secrets, services: Services, adapter: Adapter) {
    this.secrets = secrets;
    this.services = services;
    this.adapter = adapter;
    this.server = express();

    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
    this.server.use(helmet());
    this.server.use(cookieParser(this.secrets.cookieSecret));
    this.server.use(
      cors({ origin: this.secrets.clientOrigin, ...corsOptions }),
    );
    let morganMiddleware = new MorganMiddleware();
    this.server.use(morganMiddleware.middleware);
    this.server.use(passport.initialize() as express.RequestHandler);

    this.health();
    this.authentication();

    this.server.use(`/api/v1`, this.router);

    this.user();
    this.chat();
    this.council();
    this.apiKey();

    this.testPoolConnection();

    this.server.use(Route404);
    this.server.use(ErrorHandlerMiddleware);
  }

  async testPoolConnection() {
    const client = await this.adapter.pgPool.connect();

    try {
      await client.query("SELECT 1");
      console.log("PostgreSQL connected successfully");
    } catch (err) {
      console.error("Failed to connect to PostgreSQL:", err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  listen() {
    this.server.listen(this.secrets.port, () => {
      console.log(
        `Listening on port http://localhost:${this.secrets.port} ...`,
      );
    });
  }

  health() {
    this.server.get("/health", (_req, res) => {
      return res.status(StatusCodes.OK).send("kakcil is up");
    });
  }

  authentication() {
    const router = new AuthenticationHandler(
      this.services.authenticationService,
      this.secrets,
      this.adapter,
    );
    this.server.use("/auth", router.router);
  }

  user() {
    const router = new UserHandler(this.services.userService);
    this.router.use(
      "/users",
      Authorize(this.services.authenticationService),
      router.router,
    );
  }

  chat() {
    const router = new ChatHandler(this.adapter, this.services);
    this.router.use(
      "/chats",
      Authorize(this.services.authenticationService),
      router.router,
    );
  }

  council() {
    const router = new CouncilHandler(this.services.councilService);
    this.router.use(
      "/council",
      Authorize(this.services.authenticationService),
      router.router,
    );
  }

  apiKey() {
    const router = new ApiKeyHandler(this.adapter, this.services);
    this.router.use(
      "/api-key",
      Authorize(this.services.authenticationService),
      router.router,
    );
  }

  subscription() {
    const router = new SubscriptionHandler(this.adapter, this.services);
    this.router.use(
      "/subscription",
      Authorize(this.services.authenticationService),
      router.router,
    );
  }

  webhook() {
    this.router.use("/webhook", express.raw({ type: "application/json" }));
    const router = new WebhookHandler(this.adapter, this.services);
    this.router.use("/webhook", router.router);
  }
}
