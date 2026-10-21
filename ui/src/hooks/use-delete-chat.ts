import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatService.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.list() });
      queryClient.removeQueries({ queryKey: queryKeys.chat.graph(chatId) });
      toast.success("Chat deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete chat"));
    },
  });
}
