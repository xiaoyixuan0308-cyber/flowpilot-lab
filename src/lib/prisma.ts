import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDbEnvConfig } from "@/server/constants/db-env";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDbEnvConfig().url }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
