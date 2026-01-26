export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: () => [...queryKeys.auth.all, "current-user"] as const,
    refreshToken: () => [...queryKeys.auth.all, "refresh-token"] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    byEmail: (email: string) =>
      [...queryKeys.users.all, "email", email] as const,
  },
  chat: {
    all: ["chat"] as const,
    lists: () => [...queryKeys.chat.all, "list"] as const,
    list: () => [...queryKeys.chat.lists()] as const,
    details: () => [...queryKeys.chat.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.chat.details(), id] as const,
    messages: (chatId?: string) =>
      chatId
        ? [...queryKeys.chat.all, "messages", chatId]
        : [...queryKeys.chat.all, "messages"],
  },
  council: {
    all: ["council"] as const,
    members: () => [...queryKeys.council.all, "members"] as const,
    models: () => [...queryKeys.council.all, "models"] as const,
  },
} as const;

