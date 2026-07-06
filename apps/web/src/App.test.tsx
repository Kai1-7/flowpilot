import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { templateDefinitions } from "@flowpilot/shared";
import App from "./App";

function renderApp(route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("FlowPilot UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/dashboard")) {
          return new Response(
            JSON.stringify({
              automationCount: 2,
              enabledAutomationCount: 2,
              runCount: 1,
              successCount: 1,
              failedCount: 0,
              artifactCount: 1,
              templates: [],
              recentRuns: [
                {
                  id: "run_1",
                  automationId: "auto_1",
                  status: "success",
                  trigger: "manual",
                  startedAt: new Date().toISOString(),
                  finishedAt: new Date().toISOString(),
                  durationMs: 42,
                  attempt: 1,
                  error: null,
                  output: {},
                  automation: { name: "CSV Insight" }
                }
              ]
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }

        if (url.endsWith("/api/templates")) {
          return new Response(JSON.stringify({ templates: templateDefinitions }), {
            status: 200,
            headers: { "content-type": "application/json" }
          });
        }

        if (url.includes("/api/templates/") && url.endsWith("/validate")) {
          return new Response(
            JSON.stringify({
              ok: true,
              templateKey: "csv-report",
              config: {
                csvPath: "sample-customers.csv",
                reportName: "customer-csv-profile",
                delimiter: ","
              }
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }

        if (url.endsWith("/api/automations")) {
          return new Response(JSON.stringify({ automations: [] }), {
            status: 200,
            headers: { "content-type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ templates: [], runs: [], artifacts: [] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      })
    );
  });

  it("loads the dashboard shell and metrics", async () => {
    renderApp("/");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument());
    expect(screen.getAllByText("FlowPilot").length).toBeGreaterThan(0);
    expect(screen.getByText("CSV Insight")).toBeInTheDocument();
  });

  it("renders the automations page", async () => {
    renderApp("/automations");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Automations" })).toBeInTheDocument());
    expect(screen.getByText("New automation")).toBeInTheDocument();
  });

  it("renders the guided automation builder", async () => {
    renderApp("/automations/new?template=csv-report");

    await waitFor(() => expect(screen.getByRole("heading", { name: "New automation" })).toBeInTheDocument());
    expect(screen.getByDisplayValue("Customer CSV Insight")).toBeInTheDocument();
    expect(screen.getByText("Template configuration")).toBeInTheDocument();
    expect(await screen.findByText("Config validated")).toBeInTheDocument();
  });
});
