const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

function ensureEntry(name) {
  const sourcePath = path.join(distDir, "src", `${name}.js`);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Build output not found: ${sourcePath}`);
  }

  const wrapper = `'use strict';\nrequire('./src/${name}.js');\n`;

  fs.writeFileSync(path.join(distDir, name), wrapper, "utf8");
  fs.writeFileSync(path.join(distDir, `${name}.js`), wrapper, "utf8");
}

ensureEntry("main");
ensureEntry("worker");
