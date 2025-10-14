const fs = require("fs");
const path = require("path");
const { codeFrameColumns } = require("@babel/code-frame");

const LINES_ABOVE = 2;
const LINES_BELOW = 2;

module.exports = function formatter(results) {
  let errors = 0,
    warnings = 0;
  let out = "";

  for (const r of results) {
    if (!r.messages.length) continue;

    out += `\n${r.filePath}\n`;

    let fileSource = "";
    try {
      fileSource = fs.readFileSync(r.filePath, "utf8");
    } catch {}

    for (const m of r.messages) {
      const loc = { start: { line: m.line || 1, column: m.column || 1 } };
      const sev = m.severity === 2 ? "error" : "warn";
      if (m.severity === 2) errors++;
      else warnings++;

      let frame = "";
      if (fileSource) {
        frame = codeFrameColumns(fileSource, loc, {
          linesAbove: LINES_ABOVE,
          linesBelow: LINES_BELOW,
          highlightCode: false,
          message: `${sev} ${m.ruleId ?? ""} — ${m.message}`,
        });
      }

      out += `  ${m.line}:${m.column}  ${sev}  ${m.ruleId ?? ""}  ${m.message}\n`;
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
    out += `\n✖ ${total} problems (${errors} errors, ${warnings} warnings)\n`;
  }
  return out;
};
