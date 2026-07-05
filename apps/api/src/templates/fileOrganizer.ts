import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import type { FileOrganizerConfigSchema } from "@flowpilot/shared";
import type { z } from "zod";
import { resolveSandboxPath } from "../lib/sandbox.js";
import type { TemplateExecutor } from "./types.js";

type FileOrganizerConfig = z.infer<typeof FileOrganizerConfigSchema>;

export const fileOrganizerExecutor: TemplateExecutor<FileOrganizerConfig> = async (config, context) => {
  const sourceDir = resolveSandboxPath(config.sourceDir);
  const entries = await readdir(sourceDir, { withFileTypes: true });
  const moves: Array<{ file: string; from: string; to: string; dryRun: boolean }> = [];
  const skipped: string[] = [];

  await context.log("info", config.dryRun ? "Planning sandbox file organization" : "Organizing sandbox files", {
    sourceDir: config.sourceDir
  });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    const rule = config.rules.find((candidate) =>
      candidate.extensions.map((item) => item.toLowerCase()).includes(extension)
    );

    if (!rule) {
      skipped.push(entry.name);
      continue;
    }

    const from = resolveSandboxPath(path.join(config.sourceDir, entry.name));
    const targetDir = resolveSandboxPath(rule.targetDir);
    const to = resolveSandboxPath(path.join(rule.targetDir, entry.name));

    moves.push({
      file: entry.name,
      from: path.relative(resolveSandboxPath("."), from).replaceAll(path.sep, "/"),
      to: path.relative(resolveSandboxPath("."), to).replaceAll(path.sep, "/"),
      dryRun: config.dryRun
    });

    if (!config.dryRun) {
      await mkdir(targetDir, { recursive: true });
      await rename(from, to);
    }
  }

  const content = [
    `# ${config.dryRun ? "File organization plan" : "File organization result"}`,
    "",
    `Source: \`${config.sourceDir}\``,
    `Mode: ${config.dryRun ? "dry run" : "sandbox write"}`,
    "",
    "## Planned moves",
    "",
    moves.length
      ? moves.map((move) => `- \`${move.from}\` -> \`${move.to}\``).join("\n")
      : "No matching files found.",
    "",
    "## Skipped",
    "",
    skipped.length ? skipped.map((file) => `- \`${file}\``).join("\n") : "No skipped files."
  ].join("\n");

  await context.createArtifact({
    title: config.dryRun ? "Sandbox file organization plan" : "Sandbox file organization result",
    fileName: "sandbox-file-organization",
    content,
    metadata: {
      dryRun: config.dryRun,
      moveCount: moves.length,
      skippedCount: skipped.length
    }
  });

  await context.log("info", "File organizer completed", {
    moveCount: moves.length,
    skippedCount: skipped.length,
    dryRun: config.dryRun
  });

  return {
    summary: `${moves.length} files matched, ${skipped.length} skipped`,
    output: {
      moves,
      skipped,
      dryRun: config.dryRun
    }
  };
};
