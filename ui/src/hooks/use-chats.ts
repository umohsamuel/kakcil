import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";

export function useChats() {
  const query = useQuery({
    queryKey: queryKeys.chat.list(),
    queryFn: () => chatService.getChats(),
  });

  return {
    chats: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
