#!/usr/bin/env node
/**
 * bump-version.mjs — set the desktop app version everywhere it is declared.
 *
 * Tauri reads the version from THREE places, and they must agree or the updater
 * behaves strangely (it compares the running app's version against latest.json,
 * so a stale Cargo.toml can make an update look like a downgrade and get
 * silently skipped):
 *
 *   client/package.json                     — JS side / npm
 *   client/src-tauri/tauri.conf.json        — what Tauri stamps on the bundle
 *   client/src-tauri/Cargo.toml             — the Rust crate version
 *
 * Usage:
 *   node scripts/bump-version.mjs 0.2.0
 *   npm run release -- 0.2.0
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(here, "..");

const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/bump-version.mjs <version>   e.g. 0.2.0");
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(
    `"${version}" is not a valid semver version (expected e.g. 1.2.3).`,
  );
  process.exit(1);
}

function patch(file, pattern, replacement, label) {
  const path = resolve(clientRoot, file);
  const before = readFileSync(path, "utf8");
  const after = before.replace(pattern, replacement);
  if (after === before) {
    console.error(`✗ ${label}: no match in ${file} — bump it by hand.`);
    process.exitCode = 1;
    return;
  }
  writeFileSync(path, after);
  console.log(`✓ ${label.padEnd(12)} ${file}`);
}

// package.json has a top-level "version" that is not followed by a nested
// "dependencies"/"devDependencies" key in the same first block, so anchor on
// the opening brace to avoid touching dependency version ranges.
patch(
  "package.json",
  /^(\s*"version":\s*")[^"]+(")/m,
  `$1${version}$2`,
  "package.json",
);

patch(
  "src-tauri/tauri.conf.json",
  /^(\s*"version":\s*")[^"]+(")/m,
  `$1${version}$2`,
  "tauri.conf",
);

// Cargo.toml: only the [package] version, which is the first bare `version =`.
patch(
  "src-tauri/Cargo.toml",
  /^(version\s*=\s*")[^"]+(")/m,
  `$1${version}$2`,
  "Cargo.toml",
);

if (process.exitCode) {
  console.error("\nSome files were not updated — fix the mismatches above.");
} else {
  console.log(`\nVersion set to ${version} in all three files.`);
  console.log(
    "Next: commit, then tag with `git tag v" + version + "` and push —",
  );
  console.log(
    "the release workflow builds and publishes the signed updater payload.",
  );
}
