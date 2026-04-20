import { create } from "zustand";

type Step = 1 | 2 | 3 | 4;

export type MigrateState = {
  step: Step;
  v1_host_ip: string;
  v1_ssh_user: string;
  v1_bench_path: string;
  v1_site_name: string;
  v3_server: string;
  v3_site_id: string;
  v3_domain: string;
  v3_deploy_candidate: string;
  v3_access_mode: "public-https" | "private" | "internal";
  staging_domain: string;
  createdJobName: string | null;
  setField: <K extends keyof MigrateState>(k: K, v: MigrateState[K]) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
};

const initial: Omit<MigrateState, "setField" | "next" | "prev" | "reset"> = {
  step: 1,
  v1_host_ip: "",
  v1_ssh_user: "frappe",
  v1_bench_path: "/home/frappe/frappe-bench",
  v1_site_name: "",
  v3_server: "",
  v3_site_id: "",
  v3_domain: "",
  v3_deploy_candidate: "",
  v3_access_mode: "public-https",
  staging_domain: "",
  createdJobName: null,
};

export const useMigrate = create<MigrateState>((set) => ({
  ...initial,
  setField: (k, v) => set({ [k]: v } as Partial<MigrateState>),
  next: () => set((s) => ({ step: Math.min(4, s.step + 1) as Step })),
  prev: () => set((s) => ({ step: Math.max(1, s.step - 1) as Step })),
  reset: () => set({ ...initial }),
}));
