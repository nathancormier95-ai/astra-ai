import { describe, expect, it } from "vitest";

describe("application title configuration", () => {
  it("uses OmniMind as the configured display title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("OmniMind");
  });
});
