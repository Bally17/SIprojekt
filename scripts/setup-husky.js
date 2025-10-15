#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const isWindows = os.platform() === "win32";
const shell = isWindows ? process.env.ComSpec || "powershell.exe" : "/bin/bash";

const binDir = path.join(__dirname, "../node_modules/.bin");
const huskyBin = path.join(binDir, "husky");

function fixBinPermissions() {
  if (isWindows) return;
  if (!fs.existsSync(binDir)) return;

  const files = fs.readdirSync(binDir);
  for (const file of files) {
    const fullPath = path.join(binDir, file);
    try {
      fs.chmodSync(fullPath, 0o755);
    } catch (e) {
      console.warn(`⚠️  Could not fix permissions for ${file}: ${e.message}`);
    }
  }
  console.log("🔧 Fixed execute permissions in node_modules/.bin (macOS/Linux)");
}

try {
  if (process.env.CI) {
    console.log("⏭️  Skipping Husky install in CI environment");
    process.exit(0);
  }

  fixBinPermissions();

  if (fs.existsSync(huskyBin)) {
    try {
      fs.chmodSync(huskyBin, 0o755);
    } catch {}
  }

  console.log("🐶 Installing Husky hooks...");
  execSync("npx husky install", { stdio: "inherit", shell });
  console.log("✅ Husky installed successfully!");
} catch (err) {
  console.error("❌ Husky install failed:", err.message);
  process.exit(1);
}
