import { useInfiniteQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";

export function useChats() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.chat.list(),
    queryFn: ({ pageParam }) => chatService.getChats(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });

  return {
    chats: query.data?.pages.flatMap((page) => page.chats) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    hasMore: query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
    fetchMore: query.fetchNextPage,
  };
}
