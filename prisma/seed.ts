import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PrismaClient as PrismaClientType } from "@prisma/client";

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../apps/api/package.json"),
);
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new () => PrismaClientType;
};

const prisma = new PrismaClient();

async function main() {
  // Add reference data (organizations, restaurants, tables) here.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
