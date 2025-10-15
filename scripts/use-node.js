#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");

const requiredNodeVersion = fs.readFileSync(".nvmrc", "utf8").trim();
const currentNodeVersion = process.versions.node;
const isWindows = os.platform() === "win32";

function hasNvm() {
  try {
    execSync("nvm --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function installNvm() {
  console.log("⚙️  Installing NVM...");
  if (isWindows) {
    console.log("📦 Downloading NVM for Windows...");
    execSync(
      'powershell -Command "Invoke-WebRequest https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.zip -OutFile nvm.zip; Expand-Archive nvm.zip -DestinationPath $env:ProgramData\\nvm -Force"',
      { stdio: "inherit" }
    );
    console.log("✅ NVM installed! Restart your terminal if it doesn’t work immediately.");
  } else {
    console.log("📦 Downloading NVM for macOS/Linux...");
    execSync(
      "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash",
      { stdio: "inherit", shell: "/bin/bash" }
    );
    console.log("✅ NVM installed! Reload your shell or restart terminal.");
  }
}

if (!currentNodeVersion.startsWith(requiredNodeVersion)) {
  console.log(`⚠️  Wrong Node.js version detected!`);
  console.log(`👉  Required: ${requiredNodeVersion}, but you have: ${currentNodeVersion}`);

  if (!hasNvm()) {
    installNvm();
  }

  const shell = isWindows ? "powershell.exe" : "/bin/bash";
  const commands = [
    `nvm install ${requiredNodeVersion}`,
    `nvm use ${requiredNodeVersion}`
  ];

  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: "inherit", shell });
    } catch {
      console.error(`❌ Command failed: ${cmd}`);
      process.exit(1);
    }
  }

  console.log(`✅ Now using Node ${requiredNodeVersion}`);
} else {
  console.log(`✅ Node.js version ${currentNodeVersion} is correct.`);
}
