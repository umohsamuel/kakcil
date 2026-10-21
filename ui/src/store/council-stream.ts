import { create } from "zustand";
import { streamSSE } from "@/services/sse.service";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type {
  ComposerTarget,
  CouncilBranchEvent,
  CouncilModelErrorEvent,
  CouncilPartialEvent,
  CouncilResponseEvent,
  CouncilSavedEvent,
  CouncilStartEvent,
  CouncilVoteResultEvent,
  ModelStatus,
} from "@/types/chat";

export type StreamPhase = "responding" | "voting" | "saving" | "done" | "error";

export interface PendingModel {
  model: string;
  status: ModelStatus;
  content: string;
  error?: string;
  votes?: number;
}

export interface CouncilStream {
  key: string;
  chatId?: string;
  prompt: string;
  target: ComposerTarget;
  phase: StreamPhase;
  order: string[];
  models: Record<string, PendingModel>;
  winner?: string;
  answer?: string;
  topic?: string;
  error?: string;
  branchId?: string | null;
  roundId?: string;
  startedAt: number;
}

interface CouncilStreamState {
  streams: Record<string, CouncilStream>;
  viewingKey: string | null;
  setViewingKey: (key: string | null) => void;
  removeStream: (key: string) => void;
}

export const useCouncilStreamStore = create<CouncilStreamState>((set) => ({
  streams: {},
  viewingKey: null,
  setViewingKey: (key) => set({ viewingKey: key }),
  removeStream: (key) =>
    set((state) => {
      if (!state.streams[key]) return state;
      const streams = { ...state.streams };
      delete streams[key];
      return { streams };
    }),
}));

function updateStream(
  key: string,
  updater: (stream: CouncilStream) => CouncilStream
) {
  useCouncilStreamStore.setState((state) => {
    const stream = state.streams[key];
    if (!stream) return state;
    return { streams: { ...state.streams, [key]: updater(stream) } };
  });
}

function upsertModel(
  stream: CouncilStream,
  model: string,
  patch: Partial<PendingModel>
): CouncilStream {
  const existing = stream.models[model] ?? {
    model,
    status: "generating" as ModelStatus,
    content: "",
  };
  return {
    ...stream,
    order: stream.order.includes(model)
      ? stream.order
      : [...stream.order, model],
    models: { ...stream.models, [model]: { ...existing, ...patch } },
  };
}

function moveStream(fromKey: string, toKey: string) {
  useCouncilStreamStore.setState((state) => {
    const stream = state.streams[fromKey];
    if (!stream || fromKey === toKey) return state;
    const streams = { ...state.streams };
    delete streams[fromKey];
    streams[toKey] = { ...stream, key: toKey, chatId: toKey };
    return {
      streams,
      viewingKey: state.viewingKey === fromKey ? toKey : state.viewingKey,
    };
  });
}

export function isStreamActive(stream?: CouncilStream) {
  return (
    !!stream &&
    (stream.phase === "responding" ||
      stream.phase === "voting" ||
      stream.phase === "saving")
  );
}

interface StartCouncilStreamOptions {
  key: string;
  chatId?: string;
  message: string;
  target: ComposerTarget;
  onChatCreated?: (chatId: string) => void;
  onBranchCreated?: (branchId: string) => void;
}

export async function startCouncilStream({
  key,
  chatId,
  message,
  target,
  onChatCreated,
  onBranchCreated,
}: StartCouncilStreamOptions) {
  let currentKey = key;
  let currentChatId = chatId;
  const pendingPartials = new Map<string, string>();
  let frame: number | null = null;

  const flushPartials = () => {
    frame = null;
    if (pendingPartials.size === 0) return;
    const partials = new Map(pendingPartials);
    pendingPartials.clear();
    updateStream(currentKey, (stream) => {
      let next = stream;
      partials.forEach((content, model) => {
        if (
          next.models[model]?.status === "generating" ||
          !next.models[model]
        ) {
          next = upsertModel(next, model, { content, status: "generating" });
        }
      });
      return next;
    });
  };

  const cancelFrame = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    flushPartials();
  };

  useCouncilStreamStore.setState((state) => ({
    streams: {
      ...state.streams,
      [key]: {
        key,
        chatId,
        prompt: message,
        target,
        phase: "responding",
        order: [],
        models: {},
        startedAt: Date.now(),
      },
    },
  }));

  const body = {
    message,
    chat_id: chatId,
    branch_id:
      target.kind === "thread" ? (target.branchId ?? undefined) : undefined,
    from_response_id: target.kind === "branch" ? target.responseId : undefined,
  };

  const fail = (error: string) => {
    cancelFrame();
    updateStream(currentKey, (stream) => ({
      ...stream,
      phase: "error",
      error,
      models: Object.fromEntries(
        Object.entries(stream.models).map(([model, entry]) => [
          model,
          entry.status === "generating"
            ? { ...entry, status: "failed" as ModelStatus }
            : entry,
        ])
      ),
    }));
  };

  try {
    await streamSSE(
      chatId ? "/api/v1/chats" : "/api/v1/chats/new",
      body,
      (event, data) => {
        switch (event) {
          case "start": {
            const { models } = data as CouncilStartEvent;
            updateStream(currentKey, (stream) =>
              models.reduce(
                (next, model) => upsertModel(next, model, {}),
                stream
              )
            );
            break;
          }
          case "llmPartial": {
            const { model, partial } = data as CouncilPartialEvent;
            pendingPartials.set(model, partial);
            if (frame === null) frame = requestAnimationFrame(flushPartials);
            break;
          }
          case "llmResponse": {
            const { model, response, topic } = data as CouncilResponseEvent;
            pendingPartials.delete(model);
            updateStream(currentKey, (stream) => ({
              ...upsertModel(stream, model, {
                content: response,
                status: "completed",
              }),
              topic: stream.topic ?? topic,
            }));
            break;
          }
          case "llmError": {
            const { model, error } = data as CouncilModelErrorEvent;
            pendingPartials.delete(model);
            updateStream(currentKey, (stream) =>
              upsertModel(stream, model, { status: "failed", error })
            );
            break;
          }
          case "voting": {
            cancelFrame();
            updateStream(currentKey, (stream) => ({
              ...stream,
              phase: "voting",
              models: Object.fromEntries(
                Object.entries(stream.models).map(([model, entry]) => [
                  model,
                  entry.status === "completed"
                    ? { ...entry, status: "voting" as ModelStatus }
                    : entry,
                ])
              ),
            }));
            break;
          }
          case "voteResponse": {
            cancelFrame();
            const result = data as CouncilVoteResultEvent;
            updateStream(currentKey, (stream) => ({
              ...stream,
              phase: "saving",
              winner: result.model,
              answer: result.response,
              topic: result.topic ?? stream.topic,
              models: Object.fromEntries(
                Object.entries(stream.models).map(([model, entry]) => [
                  model,
                  {
                    ...entry,
                    votes: result.votes?.[model] ?? entry.votes,
                    status:
                      entry.status === "failed"
                        ? entry.status
                        : model === result.model
                          ? "winner"
                          : "completed",
                  },
                ])
              ),
            }));
            break;
          }
          case "chatId": {
            const { chat_id } = data as { chat_id: string };
            currentChatId = chat_id;
            moveStream(currentKey, chat_id);
            currentKey = chat_id;
            getQueryClient().invalidateQueries({
              queryKey: queryKeys.chat.list(),
            });
            onChatCreated?.(chat_id);
            break;
          }
          case "branch": {
            const branch = data as CouncilBranchEvent;
            updateStream(currentKey, (stream) => ({
              ...stream,
              branchId: branch.id,
            }));
            onBranchCreated?.(branch.id);
            break;
          }
          case "saved": {
            const saved = data as CouncilSavedEvent;
            updateStream(currentKey, (stream) => ({
              ...stream,
              roundId: saved.round_id,
              branchId: saved.branch_id,
            }));
            break;
          }
          case "error": {
            const { error } = data as { error?: string };
            fail(error || "The council could not answer");
            break;
          }
        }
      }
    );
  } catch (error) {
    fail(getErrorMessage(error, "Could not reach the council"));
    return;
  }

  cancelFrame();

  const finished = useCouncilStreamStore.getState().streams[currentKey];
  if (!finished || finished.phase === "error") return;

  if (!finished.roundId) {
    fail("The council stopped before saving its answer");
    return;
  }

  updateStream(currentKey, (stream) => ({ ...stream, phase: "done" }));

  const queryClient = getQueryClient();
  queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
  if (currentChatId) {
    await queryClient
      .invalidateQueries({ queryKey: queryKeys.chat.graph(currentChatId) })
      .catch(() => undefined);
  }

  useCouncilStreamStore.getState().removeStream(currentKey);
}
