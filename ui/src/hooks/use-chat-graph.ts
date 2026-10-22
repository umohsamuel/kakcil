import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";

export function useChatGraph(chatId?: string) {
  return useQuery({
    queryKey: queryKeys.chat.graph(chatId ?? ""),
    queryFn: () => chatService.getGraph(chatId!),
    enabled: !!chatId,
    staleTime: 30 * 1000,
  });
}
