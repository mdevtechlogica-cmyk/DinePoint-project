import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const schemaDir = path.resolve(apiRoot, '../../prisma');
const linkRoot = path.join(schemaDir, 'node_modules');

fs.mkdirSync(linkRoot, { recursive: true });

for (const name of ['@prisma', 'prisma']) {
  const target = path.join(apiRoot, 'node_modules', name);
  const linkPath = path.join(linkRoot, name);

  if (!fs.existsSync(target)) {
    throw new Error(
      `Missing ${target}. Install the API dependencies before generating Prisma Client.`,
    );
  }

  if (fs.existsSync(linkPath)) {
    continue;
  }

  fs.symlinkSync(
    target,
    linkPath,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
}
