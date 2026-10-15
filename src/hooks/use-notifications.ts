import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotificationData } from "@/lib/notifications-data";
import { supabase } from "@/lib/supabase-client";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotificationData,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDismissReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("payment_reminders")
        .update({ dismissed_at: new Date().toISOString() })
        .eq("id", reminderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
