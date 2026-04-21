import "./lib/load-env";

import { backupFinanceSourceMappings } from "../src/lib/finance/source-mapping-backup";

async function main() {
  const result = await backupFinanceSourceMappings((message) => {
    console.log(message);
  });

  console.log(
    JSON.stringify(
      {
        generatedAt: result.generatedAt,
        sourceCount: result.sourceCount,
        localDir: result.localDir,
        archivePath: result.archivePath,
        driveFileId: result.driveFileId,
        driveWebViewLink: result.driveWebViewLink,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
