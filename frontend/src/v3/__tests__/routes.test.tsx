import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { V3Routes } from "../routes";
import { Suspense } from "react";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Suspense fallback={<div>loading…</div>}>
        <V3Routes />
      </Suspense>
    </MemoryRouter>,
  );
}

describe("V3Routes", () => {
  it.each([
    ["/v3", "Dashboard"],
    ["/v3/servers", "Servers/List"],
    ["/v3/servers/abc", "Servers/Detail"],
    ["/v3/sites", "Sites/List"],
    ["/v3/sites/demo", "Sites/Detail"],
    ["/v3/jobs", "Jobs/List"],
    ["/v3/jobs/JOB-0001", "Jobs/Detail"],
    ["/v3/events", "Events/List"],
  ])("renders %s as %s", async (path, label) => {
    renderAt(path);
    const el = await screen.findByText(new RegExp(label));
    expect(el).toBeInTheDocument();
  });
});
