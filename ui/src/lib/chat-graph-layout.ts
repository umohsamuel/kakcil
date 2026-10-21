import { MarkerType, type Edge, type Node } from "reactflow";
import type {
  ChatGraph,
  ChatGraphResponse,
  ChatGraphRound,
  ModelStatus,
} from "@/types/chat";
import type { CouncilStream, StreamPhase } from "@/store/council-stream";

export const PROMPT_WIDTH = 320;
export const RESPONSE_WIDTH = 240;
export const ANSWER_WIDTH = 320;

const GAP_X = 20;
const LANE_GAP = 140;
const RESPONSE_OFFSET_Y = 170;
const ANSWER_OFFSET_Y = 360;
const ROUND_HEIGHT = 540;
const BRANCH_DROP_Y = 40;
const PREVIEW_LENGTH = 260;

export const MAIN_LANE = "main";
export const PENDING_ID = "pending";

export interface PromptNodeData {
  kind: "prompt";
  roundId: string;
  text: string;
  branchLabel?: string;
  pending: boolean;
}

export interface ResponseNodeData {
  kind: "response";
  roundId: string;
  responseId: string | null;
  model: string;
  status: ModelStatus;
  preview: string;
  votes?: number;
  error?: string;
  pending: boolean;
}

export interface AnswerNodeData {
  kind: "answer";
  roundId: string;
  model: string | null;
  preview: string;
  status: "ready" | "pending" | "error";
  phase?: StreamPhase;
  error?: string;
  pending: boolean;
}

export type CouncilNodeData =
  | PromptNodeData
  | ResponseNodeData
  | AnswerNodeData;

export interface LaneInfo {
  key: string;
  branchId: string | null;
  label: string;
  roundIds: string[];
}

interface LaneGeometry {
  center: number;
  startY: number;
  roundCount: number;
}

export interface ChatGraphLayout {
  nodes: Node<CouncilNodeData>[];
  edges: Edge[];
  lanes: Map<string, LaneInfo>;
  roundLane: Map<string, string>;
  responses: Map<string, ChatGraphResponse & { roundId: string }>;
  rounds: Map<string, ChatGraphRound>;
  latestLane: string;
  latestRoundId?: string;
  geometry: Map<string, LaneGeometry>;
  responseNodeById: Map<string, string>;
  nodeY: Map<string, number>;
  rightEdge: number;
}

export interface PendingLayout {
  nodes: Node<CouncilNodeData>[];
  edges: Edge[];
  laneKey: string;
}

interface LayoutRound {
  id: string;
  prompt: string;
  pending: boolean;
  responses: ResponseNodeData[];
  answer: AnswerNodeData | null;
}

export const promptNodeId = (roundId: string) => `prompt:${roundId}`;
export const answerNodeId = (roundId: string) => `answer:${roundId}`;
export const responseNodeId = (roundId: string, key: string) =>
  `response:${roundId}:${key}`;

export const laneKeyOf = (branchId: string | null) => branchId ?? MAIN_LANE;

const preview = (text: string) =>
  text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;

const rowWidthOf = (count: number) =>
  count * RESPONSE_WIDTH + Math.max(0, count - 1) * GAP_X;

const edgeStyle = {
  base: { stroke: "var(--edge)", strokeWidth: 1.5 },
  strong: { stroke: "var(--edge-strong)", strokeWidth: 2 },
  branch: {
    stroke: "var(--edge-strong)",
    strokeWidth: 1.5,
    strokeDasharray: "6 5",
  },
};

const branchMarker = {
  type: MarkerType.ArrowClosed,
  color: "var(--edge-strong)",
  width: 14,
  height: 14,
};

function roundFromGraph(round: ChatGraphRound): LayoutRound {
  const winner = round.responses.find((response) => response.is_winner);

  return {
    id: round.id,
    prompt: round.prompt,
    pending: false,
    responses: round.responses.map((response) => ({
      kind: "response",
      roundId: round.id,
      responseId: response.id,
      model: response.model,
      status: response.is_winner ? "winner" : "completed",
      preview: preview(response.content),
      votes: response.votes_received,
      pending: false,
    })),
    answer: round.answer
      ? {
          kind: "answer",
          roundId: round.id,
          model: round.answer.model ?? winner?.model ?? null,
          preview: preview(round.answer.content),
          status: "ready",
          pending: false,
        }
      : null,
  };
}

function roundFromStream(stream: CouncilStream): LayoutRound {
  return {
    id: PENDING_ID,
    prompt: stream.prompt,
    pending: true,
    responses: stream.order.map((model) => {
      const entry = stream.models[model]!;
      return {
        kind: "response",
        roundId: PENDING_ID,
        responseId: null,
        model,
        status: entry.status,
        preview: preview(entry.content),
        votes: entry.votes,
        error: entry.error,
        pending: true,
      };
    }),
    answer: {
      kind: "answer",
      roundId: PENDING_ID,
      model: stream.winner ?? null,
      preview: stream.answer ? preview(stream.answer) : "",
      status:
        stream.phase === "error"
          ? "error"
          : stream.answer
            ? "ready"
            : "pending",
      phase: stream.phase,
      error: stream.error,
      pending: true,
    },
  };
}

function layoutRound(
  round: LayoutRound,
  center: number,
  y: number,
  options: {
    previousTailId?: string;
    originNodeId?: string;
    branchLabel?: string;
  },
  nodes: Node<CouncilNodeData>[],
  edges: Edge[],
  nodeY: Map<string, number>
) {
  const promptId = promptNodeId(round.id);

  nodes.push({
    id: promptId,
    type: "prompt",
    position: { x: center - PROMPT_WIDTH / 2, y },
    data: {
      kind: "prompt",
      roundId: round.id,
      text: round.prompt,
      branchLabel: options.branchLabel,
      pending: round.pending,
    },
  });
  nodeY.set(promptId, y);

  if (options.originNodeId) {
    edges.push({
      id: `branch:${options.originNodeId}->${promptId}`,
      source: options.originNodeId,
      sourceHandle: "right",
      target: promptId,
      targetHandle: "left",
      type: "smoothstep",
      animated: round.pending,
      style: edgeStyle.branch,
      markerEnd: branchMarker,
    });
  }

  if (options.previousTailId) {
    edges.push({
      id: `thread:${options.previousTailId}->${promptId}`,
      source: options.previousTailId,
      target: promptId,
      targetHandle: "top",
      type: "smoothstep",
      animated: round.pending,
      style: edgeStyle.strong,
    });
  }

  const rowStart = center - rowWidthOf(round.responses.length) / 2;
  const responseY = y + RESPONSE_OFFSET_Y;
  const answerId = answerNodeId(round.id);

  round.responses.forEach((response, index) => {
    const id = responseNodeId(round.id, response.responseId ?? response.model);

    nodes.push({
      id,
      type: "response",
      position: {
        x: rowStart + index * (RESPONSE_WIDTH + GAP_X),
        y: responseY,
      },
      data: response,
    });
    nodeY.set(id, responseY);

    edges.push({
      id: `ask:${promptId}->${id}`,
      source: promptId,
      target: id,
      type: "smoothstep",
      animated: response.status === "generating",
      style: edgeStyle.base,
    });

    if (round.answer && response.status !== "failed") {
      edges.push({
        id: `vote:${id}->${answerId}`,
        source: id,
        sourceHandle: "bottom",
        target: answerId,
        type: "smoothstep",
        animated: response.status === "voting",
        style: response.status === "winner" ? edgeStyle.strong : edgeStyle.base,
      });
    }
  });

  if (!round.answer) return promptId;

  const answerY = round.responses.length > 0 ? y + ANSWER_OFFSET_Y : responseY;

  nodes.push({
    id: answerId,
    type: "answer",
    position: { x: center - ANSWER_WIDTH / 2, y: answerY },
    data: round.answer,
  });
  nodeY.set(answerId, answerY);

  if (round.responses.length === 0) {
    edges.push({
      id: `ask:${promptId}->${answerId}`,
      source: promptId,
      target: answerId,
      type: "smoothstep",
      style: edgeStyle.strong,
    });
  }

  return answerId;
}

export function buildChatGraphLayout(
  graph: ChatGraph | undefined
): ChatGraphLayout {
  const lanes = new Map<string, LaneInfo & { originNodeId?: string }>();
  const laneRounds = new Map<string, LayoutRound[]>();
  const laneOrder: string[] = [MAIN_LANE];
  const rounds = new Map<string, ChatGraphRound>();
  const responses = new Map<string, ChatGraphResponse & { roundId: string }>();
  const responseNodeById = new Map<string, string>();
  const roundLane = new Map<string, string>();

  lanes.set(MAIN_LANE, {
    key: MAIN_LANE,
    branchId: null,
    label: "Main thread",
    roundIds: [],
  });
  laneRounds.set(MAIN_LANE, []);

  for (const round of graph?.rounds ?? []) {
    rounds.set(round.id, round);
    for (const response of round.responses) {
      responses.set(response.id, { ...response, roundId: round.id });
      responseNodeById.set(response.id, responseNodeId(round.id, response.id));
    }
  }

  for (const branch of graph?.branches ?? []) {
    if (lanes.has(branch.id)) continue;
    lanes.set(branch.id, {
      key: branch.id,
      branchId: branch.id,
      label: branch.branch_name || "Branch",
      roundIds: [],
      originNodeId: responseNodeById.get(branch.parent_response_id),
    });
    laneRounds.set(branch.id, []);
    laneOrder.push(branch.id);
  }

  for (const round of graph?.rounds ?? []) {
    const key = laneKeyOf(round.branch_id);
    const lane = lanes.get(key);
    if (!lane) continue;
    lane.roundIds.push(round.id);
    laneRounds.get(key)!.push(roundFromGraph(round));
    roundLane.set(round.id, key);
  }

  const nodes: Node<CouncilNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeY = new Map<string, number>();
  const geometry = new Map<string, LaneGeometry>();
  let rightEdge = -Infinity;

  for (const key of laneOrder) {
    const lane = lanes.get(key)!;
    const list = laneRounds.get(key)!;
    if (list.length === 0) continue;

    const laneWidth = Math.max(
      PROMPT_WIDTH,
      ...list.map((round) => rowWidthOf(round.responses.length))
    );
    const center = key === MAIN_LANE ? 0 : rightEdge + LANE_GAP + laneWidth / 2;
    rightEdge = Math.max(rightEdge, center + laneWidth / 2);

    const startY =
      key === MAIN_LANE
        ? 0
        : (lane.originNodeId ? (nodeY.get(lane.originNodeId) ?? 0) : 0) +
          BRANCH_DROP_Y;

    let tailId: string | undefined;
    list.forEach((round, index) => {
      tailId = layoutRound(
        round,
        center,
        startY + index * ROUND_HEIGHT,
        {
          previousTailId: tailId,
          originNodeId: index === 0 ? lane.originNodeId : undefined,
          branchLabel:
            index === 0 && key !== MAIN_LANE ? lane.label : undefined,
        },
        nodes,
        edges,
        nodeY
      );
    });

    geometry.set(key, { center, startY, roundCount: list.length });
  }

  let latestLane = MAIN_LANE;
  let latestRoundId: string | undefined;
  let latestTime = -Infinity;
  for (const round of graph?.rounds ?? []) {
    const time = new Date(round.created_at).getTime();
    if (time >= latestTime && roundLane.has(round.id)) {
      latestTime = time;
      latestLane = roundLane.get(round.id)!;
      latestRoundId = round.id;
    }
  }

  return {
    nodes,
    edges,
    lanes: new Map(
      [...lanes].map(([key, { originNodeId: _origin, ...info }]) => [key, info])
    ),
    roundLane,
    responses,
    rounds,
    latestLane,
    latestRoundId,
    geometry,
    responseNodeById,
    nodeY,
    rightEdge: Number.isFinite(rightEdge) ? rightEdge : 0,
  };
}

export function buildPendingLayout(
  base: ChatGraphLayout,
  stream: CouncilStream | undefined
): PendingLayout | null {
  if (!stream) return null;
  if (stream.roundId && base.rounds.has(stream.roundId)) return null;

  const round = roundFromStream(stream);
  const nodes: Node<CouncilNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeY = new Map<string, number>();
  const width = Math.max(PROMPT_WIDTH, rowWidthOf(round.responses.length));

  if (stream.target.kind === "branch") {
    const originNodeId = base.responseNodeById.get(stream.target.responseId);
    const center = base.rightEdge + LANE_GAP + width / 2;
    const y =
      (originNodeId ? (base.nodeY.get(originNodeId) ?? 0) : 0) + BRANCH_DROP_Y;

    layoutRound(
      round,
      center,
      y,
      { originNodeId, branchLabel: "New branch" },
      nodes,
      edges,
      nodeY
    );

    return {
      nodes,
      edges,
      laneKey: `${PENDING_ID}:${stream.target.responseId}`,
    };
  }

  const laneKey = laneKeyOf(stream.target.branchId);
  const lane = base.lanes.get(laneKey);
  const geometry = base.geometry.get(laneKey);
  const lastRoundId = lane?.roundIds[lane.roundIds.length - 1];
  const previousTailId = lastRoundId
    ? base.rounds.get(lastRoundId)?.answer
      ? answerNodeId(lastRoundId)
      : promptNodeId(lastRoundId)
    : undefined;

  const center = geometry?.center ?? 0;
  const y = geometry ? geometry.startY + geometry.roundCount * ROUND_HEIGHT : 0;

  layoutRound(round, center, y, { previousTailId }, nodes, edges, nodeY);

  return { nodes, edges, laneKey };
}
