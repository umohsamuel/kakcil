import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { councilService } from "@/services/council.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useAvailableModels() {
  const query = useQuery({
    queryKey: queryKeys.council.models(),
    queryFn: () => councilService.getAvailableModels(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes since models rarely change
  });

  return {
    models: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCouncilMembers() {
  const query = useQuery({
    queryKey: queryKeys.council.members(),
    queryFn: () => councilService.getCouncilMembers(),
  });

  return {
    members: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateCouncilMembers() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (members: string[]) =>
      councilService.updateCouncilMembers(members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.council.members() });
      toast.success("Council members updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update council members"
      );
    },
  });

  return {
    updateMembers: mutation.mutate,
    updateMembersAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useClearCouncilMembers() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => councilService.clearCouncilMembers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.council.members() });
      toast.success("All council members cleared");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to clear council members"
      );
    },
  });

  return {
    clearMembers: mutation.mutate,
    clearMembersAsync: mutation.mutateAsync,
    isClearing: mutation.isPending,
    error: mutation.error,
  };
}
