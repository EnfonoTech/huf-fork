import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { getSocket } from "../api/socket";

type UseRealtimeOpts = {
  socket?: Socket;
  channel: string;
  invalidate: QueryKey[];
  onEvent?: (payload: unknown) => void;
};

/**
 * Subscribe to a Frappe realtime channel for the lifetime of the component.
 * On each event fires invalidateQueries for every supplied key, causing
 * React Query to re-fetch via REST.
 */
export function useRealtime({ socket, channel, invalidate, onEvent }: UseRealtimeOpts): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sock = socket ?? getSocket();
    const handler = (payload: unknown) => {
      for (const key of invalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      onEvent?.(payload);
    };
    sock.on(channel, handler);
    return () => {
      sock.off(channel, handler);
    };
  }, [socket, channel, invalidate, onEvent, queryClient]);
}
