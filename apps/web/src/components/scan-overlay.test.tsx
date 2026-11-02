import type { Scan } from "@sitememory/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScanOverlay } from "./scan-overlay";

const scan: Scan = {
  id: "scan-1",
  roomId: "room-1",
  imageUrl: "/image.png",
  originalFilename: "desk.png",
  mimeType: "image/png",
  byteSize: 100,
  width: 100,
  height: 100,
  capturedAt: "2026-11-01T12:00:00.000Z",
  createdAt: "2026-11-01T12:00:00.000Z",
  updatedAt: "2026-11-01T12:00:00.000Z",
  status: "COMPLETED",
  errorMessage: null,
  provider: "mock",
  observations: [
    {
      id: "observation-1",
      scanId: "scan-1",
      label: "headphones",
      description: "Detected headphones",
      boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
      mask: { kind: "svg-path", path: "M0 0H10V10Z", width: 10, height: 10 },
      confidence: null,
      createdAt: "2026-11-01T12:00:00.000Z",
    },
  ],
};

describe("ScanOverlay", () => {
  it("renders and selects a persisted observation", () => {
    const onSelect = vi.fn();
    render(<ScanOverlay scan={scan} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Select headphones" }));
    expect(onSelect).toHaveBeenCalledWith(scan.observations[0]);
    expect(screen.getByText("headphones")).toBeInTheDocument();
  });
});
