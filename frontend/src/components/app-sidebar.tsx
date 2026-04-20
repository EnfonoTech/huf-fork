import * as React from "react"
import { Home, Bot, Workflow, Database, Plug, MessageSquare, Zap, Server, ScrollText, Users, BookOpen,
  LayoutDashboard, Server as ServerIcon, Globe, ListChecks, AlertCircle,
  Package, GitBranch, Layers, GitFork, Book, Bell, Cloud, HardDrive,
  Activity, Plus, ArrowRightLeft } from "lucide-react"
import { useLocation } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { AppSidebarHeader } from "@/components/app-sidebar-header"
import { ChatSidebarContent } from "@/components/chat/ChatSidebarContent"
import { usePermissions } from "@/contexts/PermissionsContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

/**
 * Each nav item may declare an optional `capability` string.
 * If present the item is hidden from users who don't have that capability.
 * Items with capability === null are always visible (e.g. Dashboard).
 */
const allNavItems = [
  // v3 Operations section
  { title: "Fleet Dashboard", url: "/v3", icon: LayoutDashboard, capability: null },
  { title: "Command Center", url: "/v3/ops", icon: Activity, capability: null },
  { title: "New Site…", url: "/v3/sites/new", icon: Plus, capability: null },
  { title: "Migrations", url: "/v3/migrations", icon: ArrowRightLeft, capability: null },
  { title: "Servers", url: "/v3/servers", icon: ServerIcon, capability: null },
  { title: "Sites", url: "/v3/sites", icon: Globe, capability: null },
  { title: "Agent Jobs", url: "/v3/jobs", icon: ListChecks, capability: null },
  { title: "System Events", url: "/v3/events", icon: AlertCircle, capability: null },
  // Phase 2 — Build & Deploy
  { title: "Deploy Candidates", url: "/v3/candidates", icon: Package, capability: null },
  { title: "Release Groups", url: "/v3/release-groups", icon: GitBranch, capability: null },
  { title: "Bench Templates", url: "/v3/templates", icon: Layers, capability: null },
  { title: "App Sources", url: "/v3/app-sources", icon: GitFork, capability: null },
  // Phase 2 — Ops
  { title: "Runbooks", url: "/v3/runbooks", icon: Book, capability: null },
  { title: "Notifications", url: "/v3/notifications", icon: Bell, capability: null },
  // Phase 2 — Settings
  { title: "Cloudflare", url: "/v3/settings/cloudflare", icon: Cloud, capability: null },
  { title: "Wasabi", url: "/v3/settings/wasabi", icon: HardDrive, capability: null },
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    capability: null,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
    capability: "chat.use",
  },
  {
    title: "Agents",
    url: "/agents",
    icon: Bot,
    capability: "agent.use",
  },
  {
    title: "Executions",
    url: "/executions",
    icon: Zap,
    capability: "agent.use",
  },
  {
    title: "Flows",
    url: "/flows",
    icon: Workflow,
    capability: "flows.use",
  },
  {
    title: "Data",
    url: "/data",
    icon: Database,
    capability: "agent.view_all",
  },
  {
    title: "Knowledge",
    url: "/knowledge",
    icon: BookOpen,
    capability: "agent.use",
  },
  {
    title: "AI Providers",
    url: "/providers",
    icon: Plug,
    capability: "system.providers.manage",
  },
  {
    title: "MCP Servers",
    url: "/mcp",
    icon: Server,
    capability: "system.mcp.manage",
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    capability: "users.manage",
  },
  {
    title: "Agent Prompts",
    url: "/prompts",
    icon: ScrollText,
    capability: "agent.use",
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { isMobile } = useSidebar()
  const { hasCapability, isLoading } = usePermissions()
  const isChatPage = location.pathname.startsWith('/chat')

  // Show chat list in sidebar on mobile when on chat page
  const showChatList = isMobile && isChatPage

  // While permissions are loading show only uncapability-gated items so the
  // sidebar doesn't flash/jump once capabilities resolve.
  const navItems = isLoading
    ? allNavItems.filter((item) => item.capability === null)
    : allNavItems.filter(
        (item) => item.capability === null || (item.capability && hasCapability(item.capability)),
      )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {showChatList && <ChatSidebarContent />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
