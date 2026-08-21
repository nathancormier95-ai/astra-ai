import { describe, expect, it } from "vitest";

import { buildAstraMessages, MAX_CONTEXT_MESSAGES } from "../server/astra";

describe("Astra conversation context", () => {
  it("adds the app and mode instructions before the bounded message history", () => {
    const messages = buildAstraMessages("Mode instruction", [
      { role: "user", content: "  Help me plan today.  " },
      { role: "assistant", content: "  Certainly.  " },
    ]);

    expect(messages).toEqual([
      expect.objectContaining({ role: "system", content: expect.stringContaining("all-in-one") }),
      { role: "system", content: "Mode instruction" },
      { role: "user", content: "Help me plan today." },
      { role: "assistant", content: "Certainly." },
    ]);
  });

  it("keeps only the most recent safe context window", () => {
    const messages = Array.from({ length: MAX_CONTEXT_MESSAGES + 4 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${index}`,
    }));

    const result = buildAstraMessages("Mode instruction", messages);

    expect(result).toHaveLength(MAX_CONTEXT_MESSAGES + 2);
    expect(result[2]).toEqual({ role: "user", content: "message 4" });
    expect(result.at(-1)).toEqual({ role: "assistant", content: `message ${MAX_CONTEXT_MESSAGES + 3}` });
  });
});
