import { SuccessResponse } from "@/infrastructure/responses/success";
import type ChatService from "@/service/chat";
import { type Request, type Response, Router } from "express";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import type { ModelMessage } from "ai";
import type LLMService from "@/service/llm";
import { calculateVote } from "@/infrastructure/utils/vote.ts";
import { getPaginationParams } from "@/infrastructure/utils/pagination.ts";

export default class ChatHandler {
  chatService: ChatService;
  llmService: LLMService;
  router = Router();

  constructor(chatService: ChatService, llmService: LLMService) {
    this.llmService = llmService;
    this.chatService = chatService;

    this.configureRoutes();
  }

  private configureRoutes() {
    this.router.post("/new", this.startNewChat);
    this.router.post("/", this.sendMessageToChat);

    // this.router.post("/stream", this.streamMessage);
    this.router.get("/", this.getChats);
    this.router.get("/:id/messages", this.getMessages);
  }

  private getChats = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };
    const { page, limit } = req.query as { page?: string; limit?: string };

    const filters = getPaginationParams(page, limit);

    const chats = await this.chatService.getChats(id, filters);

    return new SuccessResponse(res, chats.data, chats.meta).send();
  };

  private getMessages = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const messages = await this.chatService.getMessages(id);

    return new SuccessResponse(res, messages).send();
  };

  private sendMessageToChat = async (req: Request, res: Response) => {
    const { message, chat_id } = req.body;
    const { id } = req.user as { id: string };

    if (!chat_id) {
      throw new BadRequestError("Chat ID is required to send message");
    }

    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const prevMessages = await this.chatService.getMessages(chat_id);

      const messageHistory = prevMessages?.map((m) => ({
        role: m.role,
        content: m.content,
      })) as ModelMessage[] | undefined;

      const llmResponses = await this.llmService.promptModels(
        message,
        true,
        messageHistory,
      );

      for (const response of llmResponses) {
        if (response) {
          res.write(
            `event: llmResponse\ndata: LLM Responses ${JSON.stringify({
              prompt: response.prompt,
              model: response.model,
              topic: response.topic,
              response: response.response,
            })}\n\n`,
          );
        }
      }

      const llmScores = await this.llmService.llmRepository.vote(
        {
          prompt: message,
          history: prevMessages,
        },
        llmResponses,
        true,
      );

      for (const scores of llmScores) {
        if (scores) {
          res.write(
            `event: llmVote\ndata: LLM Vote Scores ${JSON.stringify({
              voter: scores.voter,
              topic: scores.topic,
              reasoning: scores.reasoning,
              scores: scores.scores,
            })}\n\n`,
          );
        }
      }

      const voteResult = calculateVote(llmResponses, llmScores);

      if (!voteResult || !voteResult.prompt) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: "LLM providers unavailable. Please try again later.",
          })}\n\n`,
        );
        res.end();

        return;
      }

      res.write(
        `event: voteResponse\ndata: Vote Response ${JSON.stringify({
          prompt: voteResult.prompt,
          model: voteResult.model,
          topic: voteResult.topic,
          response: voteResult.response,
        })}\n\n`,
      );

      await this.chatService.chatRepository.addMessage({
        chat_id,
        user_id: id,
        role: "user",
        content: message,
      });

      await this.chatService.chatRepository.addMessage({
        chat_id,
        user_id: id,
        role: "assistant",
        content: voteResult.response,
        model: voteResult.model,
      });

      console.log("Client closed connection");

      res.end();
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: (error as Error).message,
        })}\n\n`,
      );
      res.end();

      return;
    }
  };

  private startNewChat = async (req: Request, res: Response) => {
    const { message } = req.body;
    const { id } = req.user as { id: string };

    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const llmResponses = await this.llmService.promptModels(message, true);

      for (const response of llmResponses) {
        if (response) {
          res.write(
            `event: llmResponse\ndata: LLM Responses ${JSON.stringify({
              prompt: response.prompt,
              model: response.model,
              topic: response.topic,
              response: response.response,
            })}\n\n`,
          );
        }
      }

      const llmScores = await this.llmService.llmRepository.vote(
        {
          prompt: message,
        },
        llmResponses,
        true,
      );

      for (const scores of llmScores) {
        if (scores) {
          res.write(
            `event: llmVote\ndata: LLM Vote Scores ${JSON.stringify({
              voter: scores.voter,
              topic: scores.topic,
              reasoning: scores.reasoning,
              scores: scores.scores,
            })}\n\n`,
          );
        }
      }

      const voteResult = calculateVote(llmResponses, llmScores);

      if (!voteResult || !voteResult.prompt) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: "LLM providers unavailable. Please try again later.",
          })}\n\n`,
        );
        res.end();

        return;
      }

      res.write(
        `event: voteResponse\ndata: Vote Response ${JSON.stringify({
          prompt: voteResult.prompt,
          model: voteResult.model,
          topic: voteResult.topic,
          response: voteResult.response,
        })}\n\n`,
      );

      if (voteResult && voteResult.prompt) {
        const chat = await this.chatService.chatRepository.add({
          model: voteResult.model,
          user_id: id,
          title: voteResult.topic as string,
          system_prompt: voteResult.prompt,
        });

        res.write(
          `event: chatId\ndata: Chat ID ${JSON.stringify({
            chat_id: chat.id,
          })}\n\n`,
        );

        await this.chatService.chatRepository.addMessage({
          chat_id: chat.id,
          user_id: id,
          role: "user",
          content: message,
        });

        await this.chatService.chatRepository.addMessage({
          chat_id: chat.id,
          user_id: id,
          role: "assistant",
          content: voteResult.response,
          model: voteResult.model,
        });
      }

      console.log("Client closed connection");

      res.end();
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: (error as Error).message,
        })}\n\n`,
      );
      res.end();

      return;
    }
  };
}
