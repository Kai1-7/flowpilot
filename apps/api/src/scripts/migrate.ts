import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { apiPackageRoot } from "../config.js";

const tables = ["Artifact", "RunLog", "Run", "Automation"];

export function resolveDatabaseFile(databaseUrl = process.env.DATABASE_URL ?? "file:../../../data/flowpilot.db") {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error("FlowPilot expects a SQLite DATABASE_URL beginning with file:");
  }

  const rawPath = databaseUrl.replace(/^file:/, "");
  if (path.isAbsolute(rawPath)) return rawPath;

  return path.resolve(apiPackageRoot, "prisma", rawPath);
}

export function applyMigrations(options: { reset?: boolean; databaseFile?: string } = {}) {
  const databaseFile = options.databaseFile ?? resolveDatabaseFile();
  const migrationFile = path.join(apiPackageRoot, "prisma", "migrations", "202607040001_init", "migration.sql");
  const sql = readFileSync(migrationFile, "utf8");

  mkdirSync(path.dirname(databaseFile), { recursive: true });

  const db = new DatabaseSync(databaseFile);
  try {
    db.exec("PRAGMA foreign_keys = OFF;");

    if (options.reset ?? process.env.FLOWPILOT_RESET_DB === "1") {
      for (const table of tables) {
        db.exec(`DROP TABLE IF EXISTS "${table}";`);
      }
    }

    db.exec(sql);
    db.exec("PRAGMA foreign_keys = ON;");
  } finally {
    db.close();
  }

  return databaseFile;
}

const isCli = process.argv[1]
  ? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
  : false;

if (isCli) {
  const databaseFile = applyMigrations();
  console.log(`FlowPilot database ready at ${databaseFile}`);
}
