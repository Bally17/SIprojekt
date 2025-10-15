#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const requiredNodeVersion = fs.readFileSync(".nvmrc", "utf8").trim();
const currentNodeVersion = process.versions.node;
const isWindows = os.platform() === "win32";
const shell = isWindows ? "powershell.exe" : "/bin/bash";

function hasNvm() {
  try {
    execSync("nvm --version", { stdio: "ignore", shell });
    return true;
  } catch {
    return false;
  }
}

function installNvm() {
  if (isWindows) {
    console.log("⚙️  NVM for Windows not detected.");
    console.log("➡️  Please install it manually from:");
    console.log("   https://github.com/coreybutler/nvm-windows/releases\n");
    return;
  }

  console.log("📦 Installing NVM (macOS/Linux)...");
  execSync("curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash", {
    stdio: "inherit",
    shell,
  });
  console.log("✅ NVM installed! Please restart your terminal.");
}

function useNvmVersion() {
  if (isWindows) {
    // Windows PowerShell – príkazy sa musia spúšťať zvlášť
    try {
      execSync(`nvm install ${requiredNodeVersion}`, { stdio: "inherit", shell });
      execSync(`nvm use ${requiredNodeVersion}`, { stdio: "inherit", shell });
      console.log(`✅ Now using Node ${requiredNodeVersion}`);
    } catch {
      console.error(`❌ Could not switch Node version automatically.`);
      console.log(`Please run manually:\n  nvm install ${requiredNodeVersion}\n  nvm use ${requiredNodeVersion}`);
      process.exit(1);
    }
  } else {
    // macOS/Linux – môže použiť && chaining
    const nvmInit =
      'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
    const commands = [
      nvmInit,
      `nvm install ${requiredNodeVersion}`,
      `nvm use ${requiredNodeVersion}`,
    ].join(" && ");

    try {
      execSync(commands, { stdio: "inherit", shell });
      console.log(`✅ Now using Node ${requiredNodeVersion}`);
    } catch {
      console.error(`❌ Could not switch Node version automatically.`);
      console.log(`Please run manually:\n  nvm install ${requiredNodeVersion}\n  nvm use ${requiredNodeVersion}`);
      process.exit(1);
    }
  }
}

// --- Main ---
if (!currentNodeVersion.startsWith(requiredNodeVersion)) {
  console.log(`⚠️  Wrong Node.js version detected!`);
  console.log(`👉  Required: ${requiredNodeVersion}, but you have: ${currentNodeVersion}\n`);

  if (!hasNvm()) installNvm();
  useNvmVersion();
} else {
  console.log(`✅ Node.js version ${currentNodeVersion} is correct.`);
}
