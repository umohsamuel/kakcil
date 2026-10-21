export const queryKeys = {
  auth: {
    all: ["auth"] as const,
  },
  chat: {
    all: ["chat"] as const,
    list: () => [...queryKeys.chat.all, "list"] as const,
    graph: (chatId: string) =>
      [...queryKeys.chat.all, "graph", chatId] as const,
  },
  council: {
    all: ["council"] as const,
    members: () => [...queryKeys.council.all, "members"] as const,
    models: () => [...queryKeys.council.all, "models"] as const,
  },
  apiKeys: {
    all: ["apiKeys"] as const,
    list: () => [...queryKeys.apiKeys.all, "list"] as const,
  },
} as const;
