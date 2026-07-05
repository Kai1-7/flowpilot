import { describe, expect, it } from "vitest";
import { withRetries } from "./retry.js";

describe("withRetries", () => {
  it("retries failures and returns the successful attempt", async () => {
    let attempts = 0;

    const result = await withRetries(2, async () => {
      attempts += 1;
      if (attempts < 3) throw new Error("temporary failure");
      return "ok";
    });

    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(3);
  });

  it("stops after retry limit", async () => {
    await expect(
      withRetries(1, async () => {
        throw new Error("still broken");
      })
    ).rejects.toThrow("still broken");
  });
});
