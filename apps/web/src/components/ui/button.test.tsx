import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders its label and handles interaction", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Create room</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
