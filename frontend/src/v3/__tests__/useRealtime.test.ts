import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { Socket } from "socket.io-client";
import { useRealtime } from "../hooks/useRealtime";

describe("useRealtime", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(() => {
    queryClient.clear();
  });

  it("invalidates the supplied query key when the channel fires", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    // Create a mock socket
    const mockSocket: Partial<Socket> = {
      on: vi.fn(),
      off: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    renderHook(
      () =>
        useRealtime({
          socket: mockSocket as Socket,
          channel: "esm:site_status_change",
          invalidate: [["sites"]],
        }),
      { wrapper },
    );

    // Get the handler that was registered
    const onCall = (mockSocket.on as any).mock.calls[0];
    expect(onCall).toBeDefined();
    const [channel, handler] = onCall;

    // Verify the channel is correct
    expect(channel).toBe("esm:site_status_change");

    // Call the handler manually
    handler({ name: "demo", status: "active" });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["sites"] });
  });
});
