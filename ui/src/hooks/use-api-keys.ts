import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiKeyService } from "@/services/api-key.service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/utils";
import type { AddApiKeyRequest, UpdateApiKeyRequest } from "@/types/api-key";

export function useApiKeys() {
  const query = useQuery({
    queryKey: queryKeys.apiKeys.list(),
    queryFn: () => apiKeyService.getAll(),
  });

  const apiKeys = Array.isArray(query.data) ? query.data : [];

  return {
    apiKeys,
    activeProviders: new Set(
      apiKeys.filter((key) => key.is_active).map((key) => key.provider)
    ),
    isLoading: query.isLoading,
    error: query.error,
  };
}

function useInvalidateKeys() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.council.members() }),
    ]);
}

export function useAddApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (data: AddApiKeyRequest) => apiKeyService.add(data),
    onSuccess: async () => {
      await invalidate();
      toast.success("API key added");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not add key")),
  });
}

export function useUpdateApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (data: UpdateApiKeyRequest) => apiKeyService.update(data),
    onSuccess: async () => {
      await invalidate();
      toast.success("API key updated");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not update key")),
  });
}

export function useDeleteApiKey() {
  const invalidate = useInvalidateKeys();
  return useMutation({
    mutationFn: (id: string) => apiKeyService.deleteKey(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("API key removed");
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, "Could not remove key")),
  });
}
