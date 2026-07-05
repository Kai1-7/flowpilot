import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  flowpilotPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.flowpilotPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.flowpilotPrisma = prisma;
}
