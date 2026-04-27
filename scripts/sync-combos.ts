import "./lib/load-env";

import { runComboSync } from "../src/lib/combos/sync";

async function main() {
  const summary = await runComboSync();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
