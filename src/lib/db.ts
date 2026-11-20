// One PrismaClient for the whole server. In dev, Next.js re-evaluates modules
// on every edit, so the instance is kept on globalThis to avoid opening a
// new SQLite connection on each reload.
import { PrismaClient } from "@prisma/client";

const globalForDb = globalThis as { prisma?: PrismaClient };

export const db = globalForDb.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = db;
}
