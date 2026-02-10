import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useDeleteChat() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (chatId: string) => chatService.deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
      toast.success("Chat deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete chat");
    },
  });

  return {
    deleteChat: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}
