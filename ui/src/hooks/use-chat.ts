import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";
import { SendMessageRequest, BranchFromResponseRequest } from "@/types/chat";
import { useCallback } from "react";

const PAGE_SIZE = 20;

export function useMessages(chatId?: string, branchId?: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.chat.messages(chatId, branchId),
    queryFn: ({ pageParam = 0 }) =>
      chatService.getMessages(
        chatId!,
        PAGE_SIZE,
        pageParam * PAGE_SIZE,
        branchId
      ),
    enabled: !!chatId,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer messages than PAGE_SIZE, there are no more pages
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });

  // Flatten and deduplicate messages from all pages
  const messages = query.data
    ? !query.data.pages
      ? []
      : (() => {
          const seen = new Set<string>();
          return query.data.pages.flat().filter((msg) => {
            if (seen.has(msg.id)) return false;
            seen.add(msg.id);
            return true;
          });
        })()
    : [];

  const fetchMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      return query.fetchNextPage();
    }
    return Promise.resolve();
  }, [query]);

  return {
    messages,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage ?? false,
    error: query.error,
    refetch: query.refetch,
    fetchMore,
  };
}

export function useChat(chatId?: string) {
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => chatService.sendMessage(data),
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.messages(chatId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
    },
  });

  return {
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
    data: sendMessageMutation.data,
  };
}

export function useStartChat() {
  const queryClient = useQueryClient();

  const startChatMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => chatService.startNewChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
    },
  });

  return {
    startChat: startChatMutation.mutate,
    startChatAsync: startChatMutation.mutateAsync,
    isStarting: startChatMutation.isPending,
    error: startChatMutation.error,
    data: startChatMutation.data,
  };
}

// Hook for branching from a council response
export function useBranchFromResponse(chatId: string) {
  const queryClient = useQueryClient();

  const branchMutation = useMutation({
    mutationFn: (data: BranchFromResponseRequest) =>
      chatService.branchFromResponse(data),
    onSuccess: () => {
      // Invalidate chat list to show new branch
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
      if (chatId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chat.branches(chatId),
        });
      }
    },
  });

  return {
    branchFromResponse: branchMutation.mutate,
    branchFromResponseAsync: branchMutation.mutateAsync,
    isBranching: branchMutation.isPending,
    error: branchMutation.error,
    branchData: branchMutation.data,
  };
}

// Hook for fetching council responses for a message
export function useCouncilResponses(chatId: string, messageId?: string) {
  const query = useQuery({
    queryKey: queryKeys.chat.councilResponses(chatId, messageId || ""),
    queryFn: () => chatService.getCouncilResponses(chatId, messageId!),
    enabled: !!chatId && !!messageId,
  });

  return {
    councilResponses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Hook for fetching branch info including parent context
export function useBranchInfo(branchId?: string | null) {
  const query = useQuery({
    queryKey: ["branch", branchId],
    queryFn: () => chatService.getBranchInfo(branchId!),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    branchInfo: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Hook for fetching all branches of a chat
export function useChatBranches(chatId: string) {
  const query = useQuery({
    queryKey: queryKeys.chat.branches(chatId),
    queryFn: () => chatService.getBranches(chatId),
    enabled: !!chatId,
  });

  return {
    branches: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
