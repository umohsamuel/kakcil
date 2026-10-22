import type { ModelMessage } from "ai";
import type ChatRepository from "@/domain/chat/repository.ts";
import type ChatBranchRepository from "@/domain/chat/branch/repository.ts";
import type CouncilResponseRepository from "@/domain/council/response/repository.ts";
import type UserApiKeyRepository from "@/domain/user/api_key/repository";
import type ModelRepository from "@/domain/model/repository.ts";
import type { CouncilMember } from "@/domain/council/entity.ts";
import type { ICouncilResponse } from "@/domain/council/response/entity.ts";
import type {
  IChat,
  IChatGraph,
  IChatGraphBranch,
  IChatGraphRound,
  IChatMessage,
} from "@/domain/chat/entity.ts";
import type LLMService from "@/service/llm";
import type { CouncilResponse } from "@/service/llm";
import type CouncilService from "@/service/council";
import type CouncilResponseService from "@/service/council/response";
import type { PaginationParams } from "@/infrastructure/utils/pagination.ts";
import { calculateVote } from "@/infrastructure/utils/vote.ts";
import { BadRequestError } from "@/infrastructure/errors/badRequest.ts";
import { NotFoundError } from "@/infrastructure/errors/notFound.ts";

const HISTORY_LIMIT = 20;
const MAX_BRANCH_DEPTH = 32;
const MAX_MESSAGE_LENGTH = 32_000;

export type CouncilEmit = (event: string, data: unknown) => void;

export type CouncilRequest = {
  user_id: string;
  message: string;
  chat_id?: string;
  branch_id?: string;
  from_response_id?: string;
};

export type PreparedCouncil = {
  user_id: string;
  message: string;
  chat: IChat | null;
  branch_id: string | null;
  origin: ICouncilResponse | null;
  parent_message_id: string | null;
  history: ModelMessage[];
  members: CouncilMember[];
};

export default class ChatService {
  chatRepository: ChatRepository;
  chatBranchRepository: ChatBranchRepository;
  councilResponseRepository: CouncilResponseRepository;
  userApiKeyRepository: UserApiKeyRepository;
  modelRepository: ModelRepository;
  llmService: LLMService;
  councilService: CouncilService;
  councilResponseService: CouncilResponseService;

  constructor(deps: {
    chatRepository: ChatRepository;
    chatBranchRepository: ChatBranchRepository;
    councilResponseRepository: CouncilResponseRepository;
    userApiKeyRepository: UserApiKeyRepository;
    modelRepository: ModelRepository;
    llmService: LLMService;
    councilService: CouncilService;
    councilResponseService: CouncilResponseService;
  }) {
    this.chatRepository = deps.chatRepository;
    this.chatBranchRepository = deps.chatBranchRepository;
    this.councilResponseRepository = deps.councilResponseRepository;
    this.userApiKeyRepository = deps.userApiKeyRepository;
    this.modelRepository = deps.modelRepository;
    this.llmService = deps.llmService;
    this.councilService = deps.councilService;
    this.councilResponseService = deps.councilResponseService;
  }

  async getChats(user_id: string, filters: PaginationParams) {
    return await this.chatRepository.getAll(user_id, filters);
  }

  async getOwnedChat(chat_id: string, user_id: string): Promise<IChat> {
    const chat = await this.chatRepository.getById(chat_id, user_id);

    if (!chat) {
      throw new NotFoundError("Chat not found");
    }

    return chat;
  }

  async getMessages(
    chat_id: string,
    user_id: string,
    limit?: number,
    offset?: number,
    branch_id?: string,
  ) {
    await this.getOwnedChat(chat_id, user_id);

    return await this.chatRepository.getMessages(
      chat_id,
      limit,
      offset,
      branch_id,
    );
  }

  async getBranches(chat_id: string, user_id: string) {
    await this.getOwnedChat(chat_id, user_id);

    return await this.chatBranchRepository.getChatBranchesByChatId(chat_id);
  }

  async getGraph(chat_id: string, user_id: string): Promise<IChatGraph> {
    const chat = await this.getOwnedChat(chat_id, user_id);

    const [messages, responses, branches] = await Promise.all([
      this.chatRepository.getAllMessages(chat_id),
      this.councilResponseRepository.findByChatId(chat_id),
      this.chatBranchRepository.getChatBranchesByChatId(chat_id),
    ]);

    const responsesByRound = new Map<string, ICouncilResponse[]>();
    for (const response of responses) {
      const list = responsesByRound.get(response.user_message_id) ?? [];
      list.push(response);
      responsesByRound.set(response.user_message_id, list);
    }

    const answers = new Map<string, IChatMessage>();
    for (const message of messages) {
      if (
        message.role === "assistant" &&
        message.parent_message_id &&
        !message.branch_from_response_id
      ) {
        answers.set(
          `${message.parent_message_id}:${message.branch_id}`,
          message,
        );
      }
    }

    const rounds: IChatGraphRound[] = messages
      .filter((message) => message.role === "user")
      .map((message) => {
        const answer = answers.get(`${message.id}:${message.branch_id}`);
        const roundResponses = (responsesByRound.get(message.id) ?? []).sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        return {
          id: message.id,
          branch_id: message.branch_id,
          prompt: message.content,
          created_at: message.created_at as Date,
          answer: answer
            ? { id: answer.id, model: answer.model, content: answer.content }
            : null,
          responses: roundResponses.map((response) => ({
            id: response.id,
            model: response.model,
            provider: response.provider,
            content: response.content,
            is_winner: response.is_winner,
            votes_received: response.votes_received ?? 0,
          })),
        };
      })
      .filter((round) => round.answer || round.responses.length > 0);

    const responseById = new Map(responses.map((r) => [r.id, r]));
    const lanesWithRounds = new Set(rounds.map((round) => round.branch_id));

    const graphBranches: IChatGraphBranch[] = branches
      .filter(
        (branch) =>
          branch.branched_from_response_id &&
          responseById.has(branch.branched_from_response_id) &&
          lanesWithRounds.has(branch.id),
      )
      .map((branch) => ({
        id: branch.id,
        branch_name: branch.branch_name,
        parent_round_id: responseById.get(branch.branched_from_response_id!)!
          .user_message_id,
        parent_response_id: branch.branched_from_response_id!,
        created_at: branch.created_at,
      }))
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    return {
      chat: {
        id: chat.id,
        title: chat.title,
        created_at: chat.created_at,
        last_message_at: chat.last_message_at,
      },
      rounds,
      branches: graphBranches,
    };
  }

  private async getLaneHistory(
    chat_id: string,
    branch_id: string | null,
    until: Date | undefined,
    depth: number,
  ): Promise<{ history: ModelMessage[]; lastMessageId: string | null }> {
    const lane = await this.chatRepository.getThreadMessages(
      chat_id,
      branch_id,
      until,
    );

    const own: ModelMessage[] = lane.map(
      (message) =>
        ({ role: message.role, content: message.content }) as ModelMessage,
    );
    const lastMessageId = lane[lane.length - 1]?.id ?? null;

    if (!branch_id || depth >= MAX_BRANCH_DEPTH) {
      return { history: own, lastMessageId };
    }

    const branch = await this.chatBranchRepository.getChatBranchById(branch_id);

    if (!branch?.branched_from_response_id) {
      return { history: own, lastMessageId };
    }

    const origin = await this.councilResponseRepository.findById(
      branch.branched_from_response_id,
    );

    if (!origin) {
      return { history: own, lastMessageId };
    }

    const prefix = await this.getOriginHistory(chat_id, origin, depth + 1);

    return { history: [...prefix, ...own], lastMessageId };
  }

  private async getOriginHistory(
    chat_id: string,
    origin: ICouncilResponse,
    depth: number,
  ): Promise<ModelMessage[]> {
    const originRound = await this.chatRepository.getMessageById(
      origin.user_message_id,
      chat_id,
    );

    if (!originRound) {
      return [];
    }

    const { history } = await this.getLaneHistory(
      chat_id,
      originRound.branch_id,
      originRound.created_at,
      depth,
    );

    const endsWithOriginPrompt =
      history[history.length - 1]?.role === "user" &&
      history[history.length - 1]?.content === originRound.content;

    return [
      ...(endsWithOriginPrompt
        ? history
        : [
            ...history,
            { role: "user", content: originRound.content } as ModelMessage,
          ]),
      { role: "assistant", content: origin.content },
    ];
  }

  async getUsableCouncil(user_id: string): Promise<CouncilMember[]> {
    const [members, keys] = await Promise.all([
      this.councilService.getUserCouncilMembers(user_id),
      this.userApiKeyRepository.getActiveKeys(user_id),
    ]);

    const providers = new Set((keys ?? []).map((key) => key.provider));

    return members.filter(
      (member) =>
        member.is_active &&
        this.modelRepository.isValidModel(member.model_name) &&
        providers.has(member.provider),
    );
  }

  async prepareCouncil(request: CouncilRequest): Promise<PreparedCouncil> {
    const message =
      typeof request.message === "string" ? request.message.trim() : "";

    if (!message) {
      throw new BadRequestError("Message is required");
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestError(
        `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`,
      );
    }

    if (request.branch_id && request.from_response_id) {
      throw new BadRequestError(
        "Send either branch_id or from_response_id, not both",
      );
    }

    if (!request.chat_id && (request.branch_id || request.from_response_id)) {
      throw new BadRequestError("chat_id is required to branch");
    }

    const members = await this.getUsableCouncil(request.user_id);

    if (members.length === 0) {
      const keys = await this.userApiKeyRepository.getActiveKeys(
        request.user_id,
      );

      throw new BadRequestError(
        keys && keys.length > 0
          ? "None of your council members use a provider you have a key for. Update your council in Settings."
          : "Add an API key in Settings to start chatting.",
      );
    }

    if (!request.chat_id) {
      return {
        user_id: request.user_id,
        message,
        chat: null,
        branch_id: null,
        origin: null,
        parent_message_id: null,
        history: [],
        members,
      };
    }

    const chat = await this.getOwnedChat(request.chat_id, request.user_id);

    if (request.from_response_id) {
      const origin = await this.councilResponseRepository.findById(
        request.from_response_id,
      );

      if (!origin || origin.chat_id !== chat.id) {
        throw new NotFoundError("Response to branch from was not found");
      }

      const history = await this.getOriginHistory(chat.id, origin, 0);

      return {
        user_id: request.user_id,
        message,
        chat,
        branch_id: null,
        origin,
        parent_message_id: origin.user_message_id,
        history: history.slice(-HISTORY_LIMIT),
        members,
      };
    }

    const branch_id = request.branch_id ?? null;

    if (branch_id) {
      const branch =
        await this.chatBranchRepository.getChatBranchById(branch_id);

      if (!branch || branch.chat_id !== chat.id) {
        throw new NotFoundError("Branch not found");
      }
    }

    const { history, lastMessageId } = await this.getLaneHistory(
      chat.id,
      branch_id,
      undefined,
      0,
    );

    return {
      user_id: request.user_id,
      message,
      chat,
      branch_id,
      origin: null,
      parent_message_id: lastMessageId,
      history: history.slice(-HISTORY_LIMIT),
      members,
    };
  }

  async runCouncil(prepared: PreparedCouncil, emit: CouncilEmit) {
    const { user_id, message, members, history } = prepared;

    emit("start", { models: members.map((member) => member.model_name) });

    const responses = await this.llmService.streamPromptModels(
      message,
      user_id,
      members,
      history,
      {
        onPartial: (model, partial, topic) =>
          emit("llmPartial", { model, partial, topic }),
        onComplete: (response) => emit("llmResponse", response),
        onError: (model, error) => emit("llmError", { model, error }),
      },
    );

    const validResponses = responses.filter(
      (response): response is CouncilResponse => response != null,
    );

    if (validResponses.length === 0) {
      emit("error", {
        error:
          "None of your council members responded. Check your API keys and model selection in Settings.",
      });
      return;
    }

    let winner = validResponses[0]!;
    let votes = new Map(validResponses.map((r) => [r.model, 0]));

    if (validResponses.length > 1) {
      emit("voting", { models: validResponses.map((r) => r.model) });

      const voters = members.filter((member) =>
        validResponses.some((response) => response.model === member.model_name),
      );

      const scores = await this.llmService.llmRepository.vote(
        { prompt: message, history },
        user_id,
        validResponses,
        voters,
      );

      for (const score of scores) {
        if (score) {
          emit("llmVote", {
            voter: score.voter,
            topic: score.topic,
            reasoning: score.reasoning,
            scores: score.scores,
          });
        }
      }

      const outcome = calculateVote(validResponses, scores);

      if (outcome) {
        winner = outcome.winner;
        votes = outcome.votes;
      }
    }

    emit("voteResponse", {
      prompt: message,
      model: winner.model,
      topic: winner.topic,
      response: winner.response,
      votes: Object.fromEntries(votes),
    });

    const chat =
      prepared.chat ??
      (await this.chatRepository.add({
        user_id,
        title: winner.topic?.trim() || message.slice(0, 80),
        system_prompt: message,
      }));

    if (!prepared.chat) {
      emit("chatId", { chat_id: chat.id });
    }

    let branch_id = prepared.branch_id;

    if (prepared.origin) {
      const branch = await this.chatBranchRepository.createChatBranch({
        chat_id: chat.id,
        branch_name: winner.topic?.trim() || `${prepared.origin.model} branch`,
        branched_from_message_id: prepared.origin.user_message_id,
        branched_from_response_id: prepared.origin.id,
        is_main_branch: false,
      });

      branch_id = branch.id;
      emit("branch", {
        id: branch.id,
        branch_name: branch.branch_name,
        parent_response_id: prepared.origin.id,
      });
    }

    const userMessage = await this.chatRepository.addMessage({
      chat_id: chat.id,
      user_id,
      role: "user",
      content: message,
      model: null,
      parent_message_id: prepared.parent_message_id,
      branch_from_response_id: prepared.origin?.id ?? null,
      branch_id,
      is_active_branch: true,
    });

    await Promise.all([
      this.councilResponseService.saveResponses(
        chat.id,
        userMessage.id,
        validResponses,
        winner.model,
        votes,
      ),
      this.chatRepository.addMessage({
        chat_id: chat.id,
        user_id,
        role: "assistant",
        content: winner.response,
        model: winner.model,
        parent_message_id: userMessage.id,
        branch_from_response_id: null,
        branch_id,
        is_active_branch: true,
      }),
      this.chatRepository.touch(chat.id),
    ]);

    emit("saved", {
      chat_id: chat.id,
      branch_id,
      round_id: userMessage.id,
    });
  }
}
