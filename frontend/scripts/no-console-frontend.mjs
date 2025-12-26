#!/usr/bin/env node
import { execSync } from "node:child_process";

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function getStagedFilesInFrontend() {
  const out = sh("git diff --cached --name-only --diff-filter=ACM");
  if (!out) return [];

  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => p.startsWith("frontend/"));
}

/**
 * Číta staged obsah súboru (z indexu), nie z disku.
 */
function getStagedContent(filePath) {
  return execSync(`git show :${filePath}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function findConsoleLogCalls(content) {
  // Hľadáme len "console.log(" v kóde. (Komentáre a stringy neriešime – ak chceš, doplním parser.)
  const lines = content.split(/\r?\n/);
  const hits = [];
  const re = /console\.log\(/;

  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) hits.push({ line: i + 1, text: lines[i] });
  }
  return hits;
}

function main() {
  const files = getStagedFilesInFrontend();

  // Vylúčime tento skript, aby sa nikdy nekontroloval (zabraňuje presne tomuto typu „self-hit“)
  // Výnimky – tieto súbory sa nikdy nekontrolujú
  const EXCLUDE_FILES = new Set([
    "frontend/scripts/no-console-frontend.mjs",
    "frontend/scripts/i18n-check.mjs",
  ]);

  const filtered = files.filter((f) => !EXCLUDE_FILES.has(f));

  if (filtered.length === 0) process.exit(0);

  let found = false;

  for (const file of filtered) {
    let content = "";
    try {
      content = getStagedContent(file);
    } catch {
      continue;
    }

    const hits = findConsoleLogCalls(content);
    if (hits.length) {
      found = true;

      // Pozor: v hláške NESMIE byť doslova "console.log(" – inak si to skript vie nájsť v stringoch.
      console.error(`ERROR: Zakázané volanie console.log v: ${file}`);
      for (const h of hits) {
        console.error(`  ${file}:${h.line}: ${h.text}`);
      }
      console.error("");
    }
  }

  if (found) {
    console.error("Commit zablokovaný: odstráň volania console.log z priečinka frontend/.");
    process.exit(1);
  }
}

main();
