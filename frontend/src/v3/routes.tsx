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
// Phase 2 additions
const CandidatesList = lazy(() => import("./pages/Candidates/List"));
const CandidateDetail = lazy(() => import("./pages/Candidates/Detail"));
const ReleaseGroupsList = lazy(() => import("./pages/ReleaseGroups/List"));
const TemplatesList = lazy(() => import("./pages/Templates/List"));
const AppSourcesList = lazy(() => import("./pages/AppSources/List"));
const RunbooksList = lazy(() => import("./pages/Runbooks/List"));
const NotificationsList = lazy(() => import("./pages/Notifications/List"));
const CloudflareSettings = lazy(() => import("./pages/Settings/Cloudflare"));
const WasabiSettings = lazy(() => import("./pages/Settings/Wasabi"));
// Phase 3
const NewSiteWizard = lazy(() => import("./pages/Sites/Wizard"));
const OpsCommandCenter = lazy(() => import("./pages/Ops"));
// Phase 4
const MigrationWizard = lazy(() => import("./pages/Sites/MigrationWizard"));
const MigrationsList = lazy(() => import("./pages/Migrations/List"));

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
        <Route path="/v3/ops" element={<OpsCommandCenter />} />
        <Route path="/v3/servers" element={<ServersList />} />
        <Route path="/v3/servers/:id" element={<ServerDetail />} />
        <Route path="/v3/sites" element={<SitesList />} />
        <Route path="/v3/sites/new" element={<NewSiteWizard />} />
        <Route path="/v3/sites/migrate" element={<MigrationWizard />} />
        <Route path="/v3/migrations" element={<MigrationsList />} />
        <Route path="/v3/sites/:id" element={<SiteDetail />} />
        <Route path="/v3/jobs" element={<JobsList />} />
        <Route path="/v3/jobs/:id" element={<JobDetail />} />
        <Route path="/v3/events" element={<EventsList />} />
        <Route path="/v3/candidates" element={<CandidatesList />} />
        <Route path="/v3/candidates/:id" element={<CandidateDetail />} />
        <Route path="/v3/release-groups" element={<ReleaseGroupsList />} />
        <Route path="/v3/templates" element={<TemplatesList />} />
        <Route path="/v3/app-sources" element={<AppSourcesList />} />
        <Route path="/v3/runbooks" element={<RunbooksList />} />
        <Route path="/v3/notifications" element={<NotificationsList />} />
        <Route path="/v3/settings/cloudflare" element={<CloudflareSettings />} />
        <Route path="/v3/settings/wasabi" element={<WasabiSettings />} />
      </Routes>
    </QueryClientProvider>
  );
}
