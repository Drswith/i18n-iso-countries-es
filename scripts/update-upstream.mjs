import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [versionArgument, commitArgument] = process.argv.slice(2);
const version = versionArgument || undefined;
const commit = commitArgument || undefined;

if (!version && !commit) {
  throw new Error(
    "Usage: pnpm run upstream:set -- <upstream-version> [upstream-commit]"
  );
}

if (version && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Invalid upstream version: ${version}`);
}

if (commit && !/^[0-9a-f]{7,40}$/i.test(commit)) {
  throw new Error(`Invalid upstream commit: ${commit}`);
}

const filePath = resolve(process.cwd(), "upstream.json");
const metadata = JSON.parse(await readFile(filePath, "utf8"));

if (version) metadata.version = version;
if (commit) metadata.commit = commit;

await writeFile(filePath, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(
  `Updated upstream baseline to ${metadata.version} (${metadata.commit}).`
);
