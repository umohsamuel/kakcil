import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { councilService } from "@/services/council.service";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

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
