import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeysService } from "@/services/apiKeys";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const useApiKeys = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiKeysService.listKeys(),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => apiKeysService.generateKey(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(t("settings.integrations.apiKeyGenerated"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate API key");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeysService.deleteKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success(t("settings.integrations.apiKeyDeleted"));
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete API key");
    }
  });

  return {
    keys,
    isLoading,
    generateKey: createMutation.mutateAsync,
    isGenerating: createMutation.isPending,
    deleteKey: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending
  };
};
