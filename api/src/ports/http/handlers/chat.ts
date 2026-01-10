import { SuccessResponse } from "@/infrastructure/responses/success";
import type ChatService from "@/service/chat";
import type VotingService from "@/service/voting";
import { type Request, type Response, Router } from "express";

export default class ChatHandler {
  chatService: ChatService;
  votingService: VotingService;
  router = Router();

  constructor(chatService: ChatService, votingService: VotingService) {
    this.chatService = chatService;
    this.votingService = votingService;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.post("/", this.sendMessage);
    this.router.post("/stream", this.streamMessage);
  }

  private sendMessage = async (req: Request, res: Response) => {
    const { message } = req.body;
    const response = await this.votingService.vote(message);

    return new SuccessResponse(res, response).send();
  };

  private streamMessage = async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const abortController = new AbortController();

      req.on("close", () => {
        abortController.abort();
      });

      const response = await this.chatService.streamText(
        message,
        false,
        abortController.signal,
      );

      for await (const chunk of response) {
        if (abortController.signal.aborted) {
          break;
        }
        res.write(`data: ${chunk}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error("streamMessage streaming error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } else {
        res.write(
          `data: [ERROR] ${error instanceof Error ? error.message : "Unknown error"}\n\n`,
        );
        res.end();
      }
    }
  };
}
