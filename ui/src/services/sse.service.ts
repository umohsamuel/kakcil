import { useAuthStore } from "@/store/auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class StreamRequestError extends Error {
  response: { status: number; data: unknown };

  constructor(status: number, data: unknown) {
    const message =
      data &&
      typeof data === "object" &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed with status ${status}`;
    super(message);
    this.response = { status, data };
  }
}

export type SSEHandler = (event: string, data: unknown) => void;

function parseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:"))
      dataLines.push(line.slice(5).trimStart());
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

export async function streamSSE(
  endpoint: string,
  body: unknown,
  onEvent: SSEHandler,
  signal?: AbortSignal
): Promise<void> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new StreamRequestError(response.status, data);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("The server did not return a stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const parsed = parseBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      if (!parsed) continue;

      let data: unknown = parsed.data;
      try {
        data = JSON.parse(parsed.data);
      } catch {}

      onEvent(parsed.event, data);
    }
  }
}
