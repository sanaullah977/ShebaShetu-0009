import { useQuery } from "@tanstack/react-query";

export interface QueueStatusData {
  status: string;
  tokenNumber: string;
  position: number;
  aheadCount: number;
  estimatedWait: number;
  doctorName: string;
  departmentName: string;
  roomNumber?: string | null;
}

export function useQueueStatus(appointmentId?: string) {
  return useQuery({
    queryKey: ["queue", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const res = await fetch(`/api/queue/${appointmentId}`);
      if (!res.ok) throw new Error("Failed to fetch queue status");
      const result = await res.json();
      return result.data as QueueStatusData;
    },
    enabled: !!appointmentId,
    refetchInterval: 15000, // Poll every 15 seconds
    staleTime: 10000,
  });
}
