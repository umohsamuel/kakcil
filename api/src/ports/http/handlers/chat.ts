import { SuccessResponse } from "@/infrastructure/responses/success";
import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  Router,
} from "express";
import { getPaginationParams } from "@/infrastructure/utils/pagination.ts";
import type Adapter from "@/adapter";
import type Services from "@/service";
import { CheckMessageLimit } from "../middlewares/rateLimiter";

const HEARTBEAT_INTERVAL_MS = 15_000;

export default class ChatHandler {
  adapter: Adapter;
  services: Services;

  router = Router();

  constructor(adapter: Adapter, services: Services) {
    this.adapter = adapter;
    this.services = services;

    this.configureRoutes();
  }

  private configureRoutes() {
    const messageGuards: RequestHandler[] = this.adapter.secrets
      .subscriptionsEnabled
      ? [CheckMessageLimit(this.adapter, this.services)]
      : [];

    this.router.post("/new", ...messageGuards, this.streamCouncil);
    this.router.post("/", ...messageGuards, this.streamCouncil);

    this.router.get("/", this.getChats);
    this.router.get("/:id/graph", this.getGraph);
    this.router.get("/:id/messages", this.getMessages);
    this.router.get("/:id/branches", this.getChatBranches);

    this.router.delete("/:id", this.deleteChat);
  }

  private getChats = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };
    const { page, limit } = req.query as { page?: string; limit?: string };

    const filters = getPaginationParams(
      page,
      Math.min(Number(limit) || 30, 100),
    );

    const chats = await this.services.chatService.getChats(id, filters);

    return new SuccessResponse(res, chats.data, chats.meta).send();
  };

  private getGraph = async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const { id } = req.params as { id: string };

    const graph = await this.services.chatService.getGraph(id, user.id);

    return new SuccessResponse(res, graph).send();
  };

  private getMessages = async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const { id } = req.params as { id: string };
    const { limit, offset, branch_id } = req.query as {
      limit?: string;
      offset?: string;
      branch_id?: string;
    };

    const messages = await this.services.chatService.getMessages(
      id,
      user.id,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
      branch_id,
    );

    return new SuccessResponse(res, messages).send();
  };

  private getChatBranches = async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const { id } = req.params as { id: string };

    const branches = await this.services.chatService.getBranches(id, user.id);

    return new SuccessResponse(res, branches).send();
  };

  private streamCouncil = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { id } = req.user as { id: string };
    const { message, chat_id, branch_id, from_response_id } = req.body as {
      message?: string;
      chat_id?: string;
      branch_id?: string;
      from_response_id?: string;
    };

    let prepared;

    try {
      prepared = await this.services.chatService.prepareCouncil({
        user_id: id,
        message: message ?? "",
        chat_id: req.path === "/new" ? undefined : chat_id,
        branch_id,
        from_response_id,
      });
    } catch (error) {
      return next(error);
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const isOpen = () => !res.writableEnded && !res.destroyed;

    const emit = (event: string, data: unknown) => {
      if (isOpen()) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const heartbeat = setInterval(() => {
      if (isOpen()) res.write(": ping\n\n");
    }, HEARTBEAT_INTERVAL_MS);

    try {
      await this.services.chatService.runCouncil(prepared, emit);
    } catch (error) {
      console.error("Council run failed:", error);
      emit("error", { error: (error as Error).message || "Council failed" });
    } finally {
      clearInterval(heartbeat);
      if (isOpen()) res.end();
    }
  };

  private deleteChat = async (req: Request, res: Response) => {
    const user = req.user as { id: string };
    const { id } = req.params as { id: string };

    await this.services.chatService.getOwnedChat(id, user.id);
    await this.services.chatService.chatRepository.delete(id, user.id);

    return new SuccessResponse(res, {
      message: "Chat deleted successfully",
    }).send();
  };
}
