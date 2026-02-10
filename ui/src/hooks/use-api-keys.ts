import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeyService } from "@/services/api-key.service";
import { queryKeys } from "@/lib/query-keys";
import type { AddApiKeyRequest, UpdateApiKeyRequest } from "@/types/api-key";
import { toast } from "sonner";

export function useApiKeys() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: () => apiKeyService.getAll(),
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: (data: AddApiKeyRequest) => apiKeyService.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
      toast.success("API key added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add API key");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateApiKeyRequest) => apiKeyService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
      toast.success("API key updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update API key");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeyService.deleteKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
      toast.success("API key deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  });

  return {
    apiKeys: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addKey: addMutation.mutate,
    isAdding: addMutation.isPending,
    updateKey: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteKey: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
