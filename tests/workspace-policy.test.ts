import { describe, expect, it } from "vitest";

import { getOmniMindModel, OMNIMIND_MODELS } from "../server/astra";
import { PLAN_LIMITS } from "../server/db";

describe("OmniMind workspace policy", () => {
  it("exposes a deliberately small, focused model catalog", () => {
    expect(OMNIMIND_MODELS.map((model) => model.id)).toEqual([
      "gpt-5-mini",
      "gpt-5",
      "gemini-3-flash-preview",
    ]);
    expect(getOmniMindModel("unknown-model")).toBeUndefined();
  });

  it("keeps Premium allowances higher than Free for every supported AI action", () => {
    for (const action of ["chat", "image", "document", "voice"] as const) {
      expect(PLAN_LIMITS.premium[action]).toBeGreaterThan(PLAN_LIMITS.free[action]);
      expect(PLAN_LIMITS.free[action]).toBeGreaterThan(0);
    }
  });
});
