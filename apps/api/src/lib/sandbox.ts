import path from "node:path";
import { sandboxDir } from "../config.js";
import { HttpError } from "./errors.js";

export function assertInsideDirectory(parentDir: string, candidatePath: string): string {
  const parent = path.resolve(parentDir);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(parent, candidate);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return candidate;
  }

  throw new HttpError(400, "Path escapes the FlowPilot sandbox", {
    parent,
    candidate
  });
}

export function resolveSandboxPath(relativePath = "."): string {
  if (path.isAbsolute(relativePath)) {
    throw new HttpError(400, "Absolute paths are not allowed in sandbox automations");
  }

  return assertInsideDirectory(sandboxDir, path.resolve(sandboxDir, relativePath));
}

export function safeFileStem(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
