import { create } from "zustand";

type Step = 1 | 2 | 3 | 4;

export type WizardState = {
  step: Step;
  site_id: string;
  domain: string;
  client_name: string;
  server: string;
  deploy_candidate: string;
  access_mode: "public-https" | "private" | "internal";
  admin_password: string;
  db_password: string;
  createdSiteName: string | null;
  createdJobName: string | null;
  setField: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
};

const initial: Omit<WizardState, "setField" | "next" | "prev" | "reset"> = {
  step: 1,
  site_id: "",
  domain: "",
  client_name: "",
  server: "",
  deploy_candidate: "",
  access_mode: "public-https",
  admin_password: "",
  db_password: "",
  createdSiteName: null,
  createdJobName: null,
};

export const useWizard = create<WizardState>((set) => ({
  ...initial,
  setField: (k, v) => set({ [k]: v } as Partial<WizardState>),
  next: () => set((s) => ({ step: Math.min(4, s.step + 1) as Step })),
  prev: () => set((s) => ({ step: Math.max(1, s.step - 1) as Step })),
  reset: () => set({ ...initial }),
}));

export function genPassword(bytes = 12): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
