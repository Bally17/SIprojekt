#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const huskyBin = path.join(__dirname, "../node_modules/.bin/husky");
const isWindows = os.platform() === "win32";
const shell = isWindows ? process.env.ComSpec || "powershell.exe" : "/bin/bash";

try {
  if (process.env.CI) {
    console.log("⏭️  Skipping Husky install in CI environment");
    process.exit(0);
  }

  if (fs.existsSync(huskyBin)) {
    try {
      fs.chmodSync(huskyBin, 0o755);
      console.log("🔧 Fixed Husky execute permission (cross-platform)");
    } catch (e) {
      console.warn("⚠️  Could not fix Husky permissions:", e.message);
    }
  }

  console.log("🐶 Installing Husky hooks...");
  execSync("npx husky install", { stdio: "inherit", shell });
  console.log("✅ Husky installed successfully!");
} catch (err) {
  console.error("❌ Husky install failed:", err.message);
  process.exit(1);
}
