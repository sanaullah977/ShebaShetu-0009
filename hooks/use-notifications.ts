import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseJsonResponse } from "@/lib/http";

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      return parseJsonResponse(res, "Failed to fetch notifications");
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return parseJsonResponse(res, "Failed to update notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markRead: markReadMutation.mutate,
  };
}
