import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import type { CsvReportConfigSchema } from "@flowpilot/shared";
import type { z } from "zod";
import { resolveSandboxPath } from "../lib/sandbox.js";
import type { TemplateExecutor } from "./types.js";

type CsvReportConfig = z.infer<typeof CsvReportConfigSchema>;
type CsvRow = Record<string, string>;

export const csvReportExecutor: TemplateExecutor<CsvReportConfig> = async (config, context) => {
  const csvPath = resolveSandboxPath(config.csvPath);
  const csv = await readFile(csvPath, "utf8");
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: config.delimiter
  }) as CsvRow[];

  const columns = Object.keys(rows[0] ?? {});
  const stats = columns.map((column) => {
    const values = rows.map((row) => row[column] ?? "");
    const filledValues = values.filter((value) => value.trim() !== "");
    const uniqueValues = Array.from(new Set(filledValues));

    return {
      column,
      filled: filledValues.length,
      empty: rows.length - filledValues.length,
      unique: uniqueValues.length,
      samples: uniqueValues.slice(0, 3)
    };
  });

  await context.log("info", "CSV parsed", {
    path: config.csvPath,
    rows: rows.length,
    columns: columns.length
  });

  const table = stats
    .map(
      (item) =>
        `| ${item.column} | ${item.filled} | ${item.empty} | ${item.unique} | ${item.samples.join(", ")} |`
    )
    .join("\n");

  const content = [
    `# ${config.reportName}`,
    "",
    `Source: \`${config.csvPath}\``,
    "",
    "## Summary",
    "",
    `- Rows: ${rows.length}`,
    `- Columns: ${columns.length}`,
    "",
    "## Column profile",
    "",
    "| Column | Filled | Empty | Unique | Samples |",
    "|---|---:|---:|---:|---|",
    table || "| No columns | 0 | 0 | 0 | |"
  ].join("\n");

  await context.createArtifact({
    title: `CSV report: ${config.reportName}`,
    fileName: config.reportName,
    content,
    metadata: {
      rowCount: rows.length,
      columnCount: columns.length,
      source: config.csvPath
    }
  });

  return {
    summary: `Profiled ${rows.length} rows across ${columns.length} columns`,
    output: {
      rowCount: rows.length,
      columnCount: columns.length,
      columns: stats
    }
  };
};
