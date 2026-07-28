import { createRequire } from "node:module";
import {
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
const versionFlag = process.argv.indexOf("--version");
const requestedVersion =
  versionFlag === -1
    ? undefined
    : process.argv[versionFlag + 1] === "--"
      ? process.argv[versionFlag + 2]
      : process.argv[versionFlag + 1];
const cldrPackage = require("cldr-localenames-full/package.json");
const cldrRoot = resolve(root, "node_modules/cldr-localenames-full/main");
const coreRoot = resolve(root, "node_modules/cldr-core");

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalizeLocale(locale) {
  return Intl.getCanonicalLocales(locale.replaceAll("_", "-"))[0];
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function filesEqual(path, contents) {
  try {
    return (await readFile(path, "utf8")) === contents;
  } catch {
    return false;
  }
}

async function getLocaleDirectories() {
  const entries = await readdir(cldrRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "root")
    .map((entry) => entry.name)
    .sort();
}

async function main() {
  if (versionFlag !== -1 && !requestedVersion) {
    throw new Error("Usage: pnpm cldr:update -- <installed-cldr-version>");
  }
  if (requestedVersion && requestedVersion !== cldrPackage.version) {
    throw new Error(
      `Requested CLDR ${requestedVersion}, but cldr-localenames-full ${cldrPackage.version} is installed.`
    );
  }

  const [aliases, parents, directories] = await Promise.all([
    readJson(resolve(coreRoot, "supplemental/aliases.json")),
    readJson(resolve(coreRoot, "supplemental/parentLocales.json")),
    getLocaleDirectories(),
  ]);

  const localeData = [];
  const territoryCodes = new Set();
  for (const directory of directories) {
    const sourcePath = resolve(cldrRoot, directory, "territories.json");
    try {
      await stat(sourcePath);
    } catch {
      continue;
    }
    const source = await readJson(sourcePath);
    const sourceLocale = Object.keys(source.main)[0];
    const locale = canonicalizeLocale(sourceLocale);
    const territories =
      source.main[sourceLocale].localeDisplayNames.territories;
    for (const territoryCode of Object.keys(territories)) {
      territoryCodes.add(territoryCode);
    }
    localeData.push({ locale, territories });
  }
  localeData.sort((left, right) => left.locale.localeCompare(right.locale));

  const parentLocales = {};
  for (const [child, parent] of Object.entries(
    parents.supplemental.parentLocales.parentLocale
  )) {
    parentLocales[canonicalizeLocale(child)] = canonicalizeLocale(parent);
  }

  const territoryAliases = {};
  for (const [alias, details] of Object.entries(
    aliases.supplemental.metadata.alias.territoryAlias
  )) {
    const replacements = details._replacement.split(" ");
    if (replacements.length === 1) {
      territoryAliases[alias] = replacements[0];
    }
  }

  const metadata = {
    cldrVersion: cldrPackage.version,
    unicodeVersion: parents.supplemental.version._unicodeVersion,
    locales: localeData.map((entry) => entry.locale),
    parentLocales,
    territoryCodes: [...territoryCodes].sort(),
  };
  const output = new Map([
    [resolve(root, "locales.json"), json(metadata)],
    [resolve(root, "territoryAliases.json"), json(territoryAliases)],
    ...localeData.map(({ locale, territories }) => [
      resolve(root, "locales", `${locale}.json`),
      json({ locale, territories }),
    ]),
  ]);

  if (check) {
    const mismatches = [];
    for (const [path, contents] of output) {
      if (!(await filesEqual(path, contents))) mismatches.push(path);
    }
    try {
      const actualLocaleFiles = await readdir(resolve(root, "locales"));
      for (const localeFile of actualLocaleFiles) {
        const path = resolve(root, "locales", localeFile);
        if (!output.has(path)) mismatches.push(path);
      }
    } catch {
      mismatches.push(resolve(root, "locales"));
    }
    if (mismatches.length > 0) {
      throw new Error(
        `Generated CLDR data is stale (${mismatches.length} files). Run pnpm cldr:generate.`
      );
    }
    console.log(
      `CLDR ${cldrPackage.version} data is current (${localeData.length} locales).`
    );
    return;
  }

  await rm(resolve(root, "locales"), { recursive: true, force: true });
  await mkdir(resolve(root, "locales"), { recursive: true });
  for (const [path, contents] of output) {
    await writeFile(path, contents, "utf8");
  }
  console.log(
    `Generated CLDR ${cldrPackage.version} data for ${localeData.length} locales.`
  );
}

await main();
