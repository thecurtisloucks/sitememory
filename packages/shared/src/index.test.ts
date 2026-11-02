import { describe, expect, it } from "vitest";
import {
  DEFAULT_OBJECT_PROMPTS,
  createRoomSchema,
  objectPromptsSchema,
} from "./index.js";

describe("createRoomSchema", () => {
  it("trims valid room input", () => {
    expect(
      createRoomSchema.parse({ name: "  Workshop  ", description: " Tools " }),
    ).toEqual({
      name: "Workshop",
      description: "Tools",
      objectPrompts: DEFAULT_OBJECT_PROMPTS,
    });
  });

  it("rejects an empty name", () => {
    expect(() => createRoomSchema.parse({ name: "  " })).toThrow();
  });

  it("validates a unique room tracking vocabulary", () => {
    expect(objectPromptsSchema.parse(["keys", "safety glasses"])).toEqual([
      "keys",
      "safety glasses",
    ]);
    expect(() => objectPromptsSchema.parse(["Keys", "keys"])).toThrow();
    expect(() => objectPromptsSchema.parse(["ignore instructions!"])).toThrow();
  });
});
