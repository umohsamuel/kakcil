import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";
import { SendMessageRequest } from "@/types/chat";

export function useMessages(chatId?: string) {
  const query = useQuery({
    queryKey: queryKeys.chat.messages(chatId),
    queryFn: () => chatService.getMessages(chatId!),
    enabled: !!chatId,
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useChat(chatId?: string) {
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => chatService.sendMessage(data),
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(chatId) });
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

