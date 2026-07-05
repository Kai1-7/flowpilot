import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const apiPackageRoot = path.resolve(dirname, "..");
export const projectRoot = process.env.FLOWPILOT_ROOT
  ? path.resolve(process.env.FLOWPILOT_ROOT)
  : path.resolve(apiPackageRoot, "../..");

process.env.DATABASE_URL ??= "file:../../../data/flowpilot.db";

export const dataDir = path.join(projectRoot, "data");
export const sandboxDir = path.join(dataDir, "sandbox");
export const artifactsDir = path.join(dataDir, "artifacts");
export const apiPort = Number.parseInt(process.env.API_PORT ?? "4357", 10);

export const appInfo = {
  name: "FlowPilot",
  version: "0.1.0",
  sandboxDir,
  artifactsDir
};
