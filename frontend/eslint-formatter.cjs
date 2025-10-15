const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { codeFrameColumns } = require("@babel/code-frame");

const LINES_ABOVE = 2;
const LINES_BELOW = 2;

module.exports = function formatter(results) {
  let errors = 0;
  let warnings = 0;
  let out = "";

  for (const r of results) {
    if (!r.messages.length) continue;

    out += `\n${chalk.underline(r.filePath)}\n`;

    let fileSource = "";
    try {
      fileSource = fs.readFileSync(r.filePath, "utf8");
    } catch {
      // ak sa súbor nepodarí načítať (napr. zmazaný), len preskočíme
    }

    for (const m of r.messages) {
      const loc = {
        start: { line: m.line || 1, column: m.column || 1 },
      };

      const sev = m.severity === 2 ? "error" : "warn";
      const sevColor = sev === "error" ? chalk.red : chalk.yellow;

      if (m.severity === 2) errors++;
      else warnings++;

      let frame = "";
      if (fileSource) {
        frame = codeFrameColumns(fileSource, loc, {
          linesAbove: LINES_ABOVE,
          linesBelow: LINES_BELOW,
          highlightCode: true,
          message: `${sevColor.bold(sev)} ${chalk.gray(m.ruleId ?? "")} — ${m.message}`,
        });
      }

      out += `  ${chalk.gray(`${m.line}:${m.column}`)}  ${sevColor(sev)}  ${chalk.cyan(
        m.ruleId ?? ""
      )}  ${m.message}\n`;

      if (frame) {
        out +=
          frame
            .split("\n")
            .map((l) => "  " + l)
            .join("\n") + "\n";
      }
    }
  }

  const total = errors + warnings;
  if (total) {
    out += `\n${chalk.bold.red("✖")} ${total} problems (${chalk.red(
      `${errors} errors`
    )}, ${chalk.yellow(`${warnings} warnings`)})\n`;
  } else {
    out += `\n${chalk.green("✔ No ESLint issues found!")}\n`;
  }

  return out;
};
