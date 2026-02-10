import { SuccessResponse } from "@/infrastructure/responses/success";
import { type Request, type Response, Router } from "express";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import type { ModelMessage } from "ai";
import { calculateVote } from "@/infrastructure/utils/vote.ts";
import { getPaginationParams } from "@/infrastructure/utils/pagination.ts";
import type { ModelName } from "@/domain/model/entity.ts";
import type Adapter from "@/adapter";
import type Services from "@/service";
import { CheckMessageLimit } from "../middlewares/rateLimiter";

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
    this.router.post(
      "/new",
      CheckMessageLimit(this.adapter, this.services),
      this.startNewChat,
    );
    this.router.post(
      "/",
      CheckMessageLimit(this.adapter, this.services),
      this.sendMessageToChat,
    );
    this.router.post(
      "/branch",
      CheckMessageLimit(this.adapter, this.services),
      this.branchFromChat,
    );

    this.router.get("/", this.getChats);
    this.router.get("/:id/messages", this.getMessages);
    this.router.get("/:id/branches", this.getChatBranches);
    this.router.get("/branch/:branchId", this.getBranchWithParentContext);

    this.router.delete("/:id", this.deleteChat);
  }

  private getChats = async (req: Request, res: Response) => {
    const { id } = req.user as { id: string };
    const { page, limit } = req.query as { page?: string; limit?: string };

    const filters = getPaginationParams(page, limit);

    const chats = await this.services.chatService.getChats(id, filters);

    return new SuccessResponse(res, chats.data, chats.meta).send();
  };

  private getMessages = async (req: Request, res: Response) => {
    const { id, limit, offset, branch_id } = req.params as {
      id: string;
      limit?: string;
      offset?: string;
      branch_id?: string;
    };

    const messages = await this.services.chatService.getMessages(
      id,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
      branch_id,
    );

    return new SuccessResponse(res, messages).send();
  };

  private sendMessageToChat = async (req: Request, res: Response) => {
    const { message, chat_id, branch_id } = req.body;
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

      const councilMembers =
        await this.services.councilService.getUserCouncilMembers(id);

      const prevMessages =
        await this.services.chatService.chatRepository.getRecentMessages(
          chat_id,
          branch_id,
          10,
        );

      const messageHistory = prevMessages?.map((m) => ({
        role: m.role,
        content: m.content,
      })) as ModelMessage[] | undefined;

      // Stream responses with partial updates
      const llmResponses = await this.services.llmService.streamPromptModels(
        message,
        id,
        councilMembers,
        messageHistory,
        {
          onPartial: (model, partial, topic) => {
            res.write(
              `event: llmPartial\ndata: LLM Partial ${JSON.stringify({
                model,
                partial,
                topic,
              })}\n\n`,
            );
          },
          onComplete: (response) => {
            res.write(
              `event: llmResponse\ndata: LLM Responses ${JSON.stringify({
                prompt: response.prompt,
                model: response.model,
                topic: response.topic,
                response: response.response,
              })}\n\n`,
            );
          },
          onError: (model, error) => {
            res.write(
              `event: llmError\ndata: LLM Error ${JSON.stringify({
                model,
                error,
              })}\n\n`,
            );
          },
        },
      );

      // Filter out null/undefined responses from failed models
      const validResponses = llmResponses.filter(
        (r): r is NonNullable<typeof r> => r != null,
      );

      if (validResponses.length === 0) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error:
              "All LLM providers failed to respond. Please try again later.",
          })}\n\n`,
        );
        res.end();
        return;
      }

      const llmScores = await this.services.llmService.llmRepository.vote(
        {
          prompt: message,
          history: prevMessages,
        },
        validResponses,
        councilMembers,
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

      const voteResult = calculateVote(validResponses, llmScores);

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

      const lastMessage = prevMessages?.[prevMessages.length - 1];

      const userMessage =
        await this.services.chatService.chatRepository.addMessage({
          chat_id,
          user_id: id,
          role: "user",
          content: message,
          model: null,
          parent_message_id: lastMessage?.id || null,
          branch_from_response_id: null,
          branch_id: branch_id || null,
          is_active_branch: true,
        });

      const userMessageId = userMessage.id;
      await this.services.councilResponseService.saveResponses(
        chat_id,
        userMessageId,
        validResponses as Array<{
          prompt: string;
          model: ModelName;
          topic?: string;
          response: string;
        }>,
        voteResult.model,
      );

      await this.services.chatService.chatRepository.addMessage({
        chat_id,
        user_id: id,
        role: "assistant",
        content: voteResult.response,
        model: voteResult.model,
        parent_message_id: userMessageId,
        branch_from_response_id: null,
        branch_id: branch_id || null,
        is_active_branch: true,
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

      const councilMembers =
        await this.services.councilService.getUserCouncilMembers(id);

      // Stream responses with partial updates
      const llmResponses = await this.services.llmService.streamPromptModels(
        message,
        id,
        councilMembers,
        undefined,
        {
          onPartial: (model, partial, topic) => {
            res.write(
              `event: llmPartial\ndata: LLM Partial ${JSON.stringify({
                model,
                partial,
                topic,
              })}\n\n`,
            );
          },
          onComplete: (response) => {
            res.write(
              `event: llmResponse\ndata: LLM Responses ${JSON.stringify({
                prompt: response.prompt,
                model: response.model,
                topic: response.topic,
                response: response.response,
              })}\n\n`,
            );
          },
          onError: (model, error) => {
            res.write(
              `event: llmError\ndata: LLM Error ${JSON.stringify({
                model,
                error,
              })}\n\n`,
            );
          },
        },
      );

      // Filter out null/undefined responses from failed models
      const validResponses = llmResponses.filter(
        (r): r is NonNullable<typeof r> => r != null,
      );

      if (validResponses.length === 0) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error:
              "All LLM providers failed to respond. Please try again later.",
          })}\n\n`,
        );
        res.end();
        return;
      }

      const llmScores = await this.services.llmService.llmRepository.vote(
        {
          prompt: message,
        },
        validResponses,
        councilMembers,
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

      const voteResult = calculateVote(validResponses, llmScores);

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
        const chat = await this.services.chatService.chatRepository.add({
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

        const userMessage =
          await this.services.chatService.chatRepository.addMessage({
            chat_id: chat.id,
            user_id: id,
            role: "user",
            content: message,
            model: null,
            parent_message_id: null,
            branch_from_response_id: null,
            branch_id: null,
            is_active_branch: true,
          });

        const userMessageId = userMessage.id;

        await Promise.all([
          this.services.councilResponseService.saveResponses(
            chat.id,
            userMessageId,
            validResponses as Array<{
              prompt: string;
              model: ModelName;
              topic?: string;
              response: string;
            }>,
            voteResult.model,
          ),

          this.services.chatService.chatRepository.addMessage({
            chat_id: chat.id,
            user_id: id,
            role: "assistant",
            content: voteResult.response,
            model: voteResult.model,
            parent_message_id: userMessageId,
            branch_from_response_id: null,
            branch_id: null,
            is_active_branch: true,
          }),
        ]);
      }

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

  private branchFromChat = async (req: Request, res: Response) => {
    const { message, chat_id, user_id, response_id } = req.body;

    const branchResponse =
      await this.adapter.councilResponseAdapter.findById(response_id);

    if (!branchResponse) {
      throw new BadRequestError("Council response not found");
    }

    const branch = await this.adapter.chatBranchAdapter.createChatBranch({
      chat_id: chat_id,
      branch_name: `${branchResponse.model} Branch`,
      branched_from_message_id: branchResponse.user_message_id,
      branched_from_response_id: response_id,
      is_main_branch: false,
    });

    const assistantMessage =
      await this.services.chatService.chatRepository.addMessage({
        chat_id: chat_id,
        user_id: user_id,
        role: "assistant",
        content: branchResponse.content,
        model: branchResponse.model,
        parent_message_id: branchResponse.user_message_id,
        branch_from_response_id: response_id,
        branch_id: branch.id,
        is_active_branch: true,
      });

    const userMessage =
      await this.services.chatService.chatRepository.addMessage({
        chat_id: chat_id,
        user_id: user_id,
        role: "user",
        content: message,
        model: null,
        parent_message_id: assistantMessage.id,
        branch_from_response_id: null,
        branch_id: branch.id,
        is_active_branch: true,
      });

    return new SuccessResponse(res, {
      branch,
      assistantMessage,
      userMessage,
    }).send();
  };

  private getChatBranches = async (req: Request, res: Response) => {
    const { id } = req.params as { id?: string };

    if (!id) {
      throw new BadRequestError("Chat ID is required");
    }

    const branches =
      await this.adapter.chatBranchAdapter.getChatBranchesByChatId(id);

    return new SuccessResponse(res, branches).send();
  };

  private getBranchWithParentContext = async (req: Request, res: Response) => {
    const { branchId } = req.params as { branchId?: string };

    if (!branchId) {
      throw new BadRequestError("Branch ID is required");
    }

    // Get the branch info
    const branch =
      await this.adapter.chatBranchAdapter.getChatBranchById(branchId);

    if (!branch) {
      throw new BadRequestError("Branch not found");
    }

    let parentMessage = null;
    let parentResponse = null;

    // If this branch was created from a message, fetch that message
    if (branch.branched_from_message_id) {
      const messages =
        await this.services.chatService.chatRepository.getRecentMessages(
          branch.chat_id,
          null,
          100,
        );
      parentMessage = messages?.find(
        (m) => m.id === branch.branched_from_message_id,
      );
    }

    // If this branch was created from a council response, fetch that response
    if (branch.branched_from_response_id) {
      parentResponse = await this.adapter.councilResponseAdapter.findById(
        branch.branched_from_response_id,
      );
    }

    return new SuccessResponse(res, {
      branch,
      parentMessage: parentMessage
        ? {
            id: parentMessage.id,
            content: parentMessage.content,
            role: parentMessage.role,
          }
        : null,
      parentResponse: parentResponse
        ? {
            id: parentResponse.id,
            model: parentResponse.model,
            content: parentResponse.content,
          }
        : null,
    }).send();
  };

  private deleteChat = async (req: Request, res: Response) => {
    const { id, user_id } = req.params as { id: string; user_id: string };

    await this.services.chatService.chatRepository.delete(id, user_id);

    return new SuccessResponse(res, {
      message: "Chat deleted successfully",
    }).send();
  };
}
