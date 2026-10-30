import { describe, expect, it } from "vitest";
import { createRoomSchema } from "./index.js";

describe("createRoomSchema", () => {
  it("trims valid room input", () => {
    expect(
      createRoomSchema.parse({ name: "  Workshop  ", description: " Tools " }),
    ).toEqual({
      name: "Workshop",
      description: "Tools",
    });
  });

  it("rejects an empty name", () => {
    expect(() => createRoomSchema.parse({ name: "  " })).toThrow();
  });
});
