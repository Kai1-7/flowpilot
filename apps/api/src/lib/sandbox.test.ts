import path from "node:path";
import { describe, expect, it } from "vitest";
import { sandboxDir } from "../config.js";
import { assertInsideDirectory, resolveSandboxPath } from "./sandbox.js";

describe("sandbox paths", () => {
  it("resolves relative paths inside the sandbox", () => {
    const resolved = resolveSandboxPath("inbox/todo.txt");

    expect(resolved).toBe(path.join(sandboxDir, "inbox", "todo.txt"));
  });

  it("rejects absolute paths", () => {
    expect(() => resolveSandboxPath(path.resolve("outside.txt"))).toThrow("Absolute paths");
  });

  it("rejects traversal outside the parent directory", () => {
    expect(() => assertInsideDirectory(sandboxDir, path.join(sandboxDir, "..", "escape.txt"))).toThrow(
      "Path escapes"
    );
  });
});
