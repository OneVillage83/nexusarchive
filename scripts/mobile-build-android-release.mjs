import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const androidDir = join(repoRoot, "android");
const capacitorCli = join(repoRoot, "node_modules", "@capacitor", "cli", "bin", "capacitor");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

function run(command, args, options = {}) {
  const isWindowsBatch = process.platform === "win32" && /\.bat$/i.test(command);
  const result = spawnSync(
    isWindowsBatch ? process.env.ComSpec || "cmd.exe" : command,
    isWindowsBatch ? ["/d", "/s", "/c", command, ...args] : args,
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
      env: process.env,
      ...options,
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(androidDir)) {
  console.error("The Android native project is missing. Run `npm run mobile:add:android` first.");
  process.exit(1);
}

run(process.execPath, [capacitorCli, "sync", "android"]);
run(gradleCommand, ["assembleRelease"], { cwd: androidDir });
