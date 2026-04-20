import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const ServersList = lazy(() => import("./pages/Servers/List"));
const ServerDetail = lazy(() => import("./pages/Servers/Detail"));
const SitesList = lazy(() => import("./pages/Sites/List"));
const SiteDetail = lazy(() => import("./pages/Sites/Detail"));
const JobsList = lazy(() => import("./pages/Jobs/List"));
const JobDetail = lazy(() => import("./pages/Jobs/Detail"));
const EventsList = lazy(() => import("./pages/Events/List"));

// V3 owns its own QueryClient so we don't require changes to HUF's App.tsx
// provider tree. staleTime/gcTime per spec §3.
const v3QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount: number, error: unknown) => {
        const status = (error as { status?: number } | null)?.status;
        if (status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

/**
 * Nested under /huf basename from HUF's BrowserRouter. These paths resolve
 * to /huf/v3/* in the browser URL.
 */
export function V3Routes() {
  return (
    <QueryClientProvider client={v3QueryClient}>
      <Routes>
        <Route path="/v3" element={<Dashboard />} />
        <Route path="/v3/servers" element={<ServersList />} />
        <Route path="/v3/servers/:id" element={<ServerDetail />} />
        <Route path="/v3/sites" element={<SitesList />} />
        <Route path="/v3/sites/:id" element={<SiteDetail />} />
        <Route path="/v3/jobs" element={<JobsList />} />
        <Route path="/v3/jobs/:id" element={<JobDetail />} />
        <Route path="/v3/events" element={<EventsList />} />
      </Routes>
    </QueryClientProvider>
  );
}
