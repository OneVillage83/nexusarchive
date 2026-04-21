import "./lib/load-env";

import { restoreFinanceSourceMappingsFromFile } from "../src/lib/finance/source-mapping-backup";

function getFilePath(args: string[]) {
  const explicit = args.find((arg) => arg.startsWith("--file="));
  if (explicit) {
    return explicit.slice("--file=".length).trim();
  }

  return args[0]?.trim() ?? null;
}

async function main() {
  const filePath = getFilePath(process.argv.slice(2));
  if (!filePath) {
    throw new Error("Missing backup file path. Pass --file=/abs/path/to/backup.json.gz");
  }

  const restored = await restoreFinanceSourceMappingsFromFile(filePath, (message) => {
    console.log(message);
  });
  console.log(`Restored ${restored.length} finance source mappings.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
