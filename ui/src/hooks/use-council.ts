import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { councilService } from "@/services/council.service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";

export function useAvailableModels() {
  const query = useQuery({
    queryKey: queryKeys.council.models(),
    queryFn: () => councilService.getAvailableModels(),
    staleTime: 1000 * 60 * 30,
  });

  return {
    models: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
  };
}

export function useCouncilMembers() {
  const query = useQuery({
    queryKey: queryKeys.council.members(),
    queryFn: () => councilService.getCouncilMembers(),
  });

  return {
    members: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
  };
}

export function useUpdateCouncilMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (members: string[]) =>
      councilService.updateCouncilMembers(members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.council.members() });
      toast.success("Council updated");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not update your council")),
  });
}
