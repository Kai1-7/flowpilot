import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Artifact, Prisma } from "@prisma/client";
import { artifactsDir } from "../config.js";
import { prisma } from "../db.js";
import { assertInsideDirectory, safeFileStem } from "../lib/sandbox.js";

export type CreateArtifactInput = {
  automationId?: string;
  runId?: string;
  title: string;
  type?: string;
  fileName?: string;
  content: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createMarkdownArtifact(input: CreateArtifactInput): Promise<Artifact> {
  const type = input.type ?? "markdown";
  const stem = safeFileStem(input.fileName ?? input.title) || "artifact";
  const runSegment = input.runId ? safeFileStem(input.runId) : "manual";
  const folder = assertInsideDirectory(artifactsDir, path.join(artifactsDir, runSegment));
  await mkdir(folder, { recursive: true });

  const filePath = assertInsideDirectory(folder, path.join(folder, `${stem}.md`));
  await writeFile(filePath, input.content, "utf8");

  const relativePath = path.relative(artifactsDir, filePath).replaceAll(path.sep, "/");

  const data: Prisma.ArtifactUncheckedCreateInput = {
    title: input.title,
    type,
    path: relativePath,
    content: input.content,
    metadata: input.metadata === undefined ? null : JSON.stringify(input.metadata)
  };

  if (input.automationId) data.automationId = input.automationId;
  if (input.runId) data.runId = input.runId;

  return prisma.artifact.create({ data });
}
