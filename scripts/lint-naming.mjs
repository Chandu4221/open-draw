import fs from "node:fs";
import path from "node:path";

let errors = 0;

function check(condition, message) {
  if (!condition) {
    console.error(`error: ${message}`);
    errors++;
  }
}

// 1. Verify package names in packages/
const packagesDir = path.resolve("packages");
for (const pkg of fs.readdirSync(packagesDir)) {
  const pkgJsonPath = path.join(packagesDir, pkg, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    const expected = `@open-draw/${pkg}`;
    check(
      pkgJson.name === expected,
      `package.json in packages/${pkg} has name "${pkgJson.name}", expected "${expected}" (R-014)`,
    );
    check(/^[a-z0-9-]+$/.test(pkg), `package folder "packages/${pkg}" must be kebab-case (R-014)`);
  }
}

// 2. Verify all files and directories in packages/ are kebab-case
function checkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      check(/^[a-z0-9-]+$/.test(entry.name), `directory "${relPath}" must be kebab-case (R-014)`);
      checkDir(fullPath);
    } else if (entry.isFile()) {
      const baseName = entry.name.replace(/(\.[a-zA-Z0-9]+)+$/, "");
      check(/^[a-z0-9-]+$/.test(baseName), `file "${relPath}" must be kebab-case (R-014)`);
    }
  }
}

checkDir(packagesDir);

if (errors > 0) {
  console.error(`\nx ${errors} naming violations found (R-014).`);
  process.exit(1);
} else {
  console.log("✔ all packages, files, and directories adhere to R-014 naming conventions.");
}
