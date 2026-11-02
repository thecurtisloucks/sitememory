import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPage } from "./assistant-page";

describe("AssistantPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a grounded answer and its clickable evidence", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              answer: "The headphones were last seen on the desk.",
              provider: "meta",
              evidence: [
                {
                  observationId: "observation-1",
                  scanId: "scan-1",
                  trackedObjectId: "object-1",
                  label: "headphones",
                  description: "Black headphones",
                  capturedAt: "2026-11-02T12:00:00.000Z",
                  imageUrl: "/api/scans/scan-1/image",
                  boundingBox: { x: 0.1, y: 0.2, width: 0.2, height: 0.2 },
                },
              ],
              supportingScanIds: ["scan-1"],
              supportingObservationIds: ["observation-1"],
              uncertaintyNotes: [],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/rooms/room-1/assistant"]}>
          <Routes>
            <Route
              path="/rooms/:roomId/assistant"
              element={<AssistantPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Question for SiteMemory"), {
      target: { value: "Where are my headphones?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(
      await screen.findByText("The headphones were last seen on the desk."),
    ).toBeInTheDocument();
    expect(screen.getByText("LIVE MUSE")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /headphones supporting observation/i }),
    ).toHaveAttribute("href", "/scans/scan-1");
  });
});
