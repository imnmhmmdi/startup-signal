import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const lockPath = path.join(process.cwd(), ".next", "lock");

if (!fs.existsSync(lockPath)) {
  process.exit(0);
}

let runningBuildPids = "";

try {
  runningBuildPids = execSync('pgrep -f "next/dist/bin/next build" || true', {
    encoding: "utf8",
  }).trim();
} catch {
  runningBuildPids = "";
}

if (runningBuildPids) {
  console.error(
    `[prebuild] Another next build is still running (pid: ${runningBuildPids}).\n` +
      "Stop it with: pkill -f \"next/dist/bin/next build\"\n" +
      "Or wait for it to finish before starting a new build."
  );
  process.exit(1);
}

fs.unlinkSync(lockPath);
console.log("[prebuild] Removed stale .next/lock from an interrupted build.");
