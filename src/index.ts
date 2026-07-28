import { remove as removeDiacritics } from "diacritics";
import codesJson from "../codes.json";
import localeMetadataJson from "../locales.json";
import territoryAliasesJson from "../territoryAliases.json";

export type Alpha2Code = string;
export type Alpha3Code = string;
export type TerritoryCode = string;
export type CountryCode =
  | Alpha2Code
  | Alpha3Code
  | TerritoryCode
  | string
  | number;
export type NameSelection = "all" | "official" | "alias";

export interface GetNameOptions {
  select?: NameSelection;
}

export type CountryName<T extends GetNameOptions> = T["select"] extends "all"
  ? string[]
  : string;

export type LocalizedCountryNames<T extends GetNameOptions = GetNameOptions> =
  Record<string, CountryName<T>>;

type LocaleList = Record<string, string | string[]>;

export interface LocaleData {
  locale: string;
  territories?: LocaleList;
  /** @deprecated Use territories. */
  countries?: LocaleList;
}

type CodeInformation = readonly [
  alpha2: string,
  alpha3: string,
  numeric: string,
  iso3166_2: string,
];
type LocaleMetadata = {
  locales: string[];
  parentLocales: Record<string, string>;
  territoryCodes: string[];
};

const codes = codesJson as unknown as readonly CodeInformation[];
const localeMetadata = localeMetadataJson as LocaleMetadata;
const territoryAliases = territoryAliasesJson as Record<string, string>;
const territoryCodes = new Set(localeMetadata.territoryCodes);
const registeredLocales: Record<string, LocaleList> = {};
const alpha2: Record<string, string> = {};
const alpha3: Record<string, string> = {};
const numeric: Record<string, string> = {};
const invertedNumeric: Record<string, string> = {};

for (const codeInformation of codes) {
  const [alpha2Code, alpha3Code, numericCode] = codeInformation;
  alpha2[alpha2Code] = alpha3Code;
  alpha3[alpha3Code] = alpha2Code;
  numeric[numericCode] = alpha2Code;
  invertedNumeric[alpha2Code] = numericCode;
}

function formatNumericCode(code: number | string): string {
  return String(`000${code || ""}`).slice(-3);
}

function hasOwnProperty(object: object, property: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function canonicalizeLocale(locale: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(locale.replace(/_/g, "-"))[0];
  } catch {
    return undefined;
  }
}

function structuralParent(locale: string): string | undefined {
  const parts = locale.split("-");
  const extension = parts.findIndex(
    (part, index) => index > 0 && part.length === 1
  );
  if (extension !== -1) return parts.slice(0, extension).join("-");

  const variant = parts.findIndex(
    (part, index) =>
      index > 0 &&
      (/^[0-9][a-z0-9]{3}$/i.test(part) || /^[a-z0-9]{5,8}$/i.test(part))
  );
  if (variant !== -1) return parts.slice(0, variant).join("-");

  const region = parts.findIndex(
    (part, index) =>
      index > 0 && (/^[A-Z]{2}$/.test(part) || /^\d{3}$/.test(part))
  );
  if (region !== -1)
    return parts.filter((_, index) => index !== region).join("-");

  // Never silently discard a script subtag. zh-Hant must not fall back to zh.
  if (parts.some((part) => /^[A-Z][a-z]{3}$/.test(part))) return undefined;
  return parts.length > 1 ? parts.slice(0, -1).join("-") : undefined;
}

function localeCandidates(locale: string): string[] {
  const canonical = canonicalizeLocale(locale);
  if (!canonical) return [];

  const candidates = [];
  const seen = new Set();
  let current: string | undefined = canonical;
  while (current && !seen.has(current)) {
    candidates.push(current);
    seen.add(current);
    current =
      localeMetadata.parentLocales[current] || structuralParent(current);
  }
  return candidates;
}

function localeList(locale: string): LocaleList | undefined {
  for (const candidate of localeCandidates(locale)) {
    const data = registeredLocales[candidate];
    if (data !== undefined) return data;
  }
  return undefined;
}

function localeFilter(
  entries: LocaleList,
  filter: (
    nameList: string | string[],
    territoryCode: string
  ) => string | string[]
): LocaleList {
  const filtered: LocaleList = {};
  for (const territoryCode of Object.keys(entries)) {
    filtered[territoryCode] = filter(entries[territoryCode], territoryCode);
  }
  return filtered;
}

function filterNameBy(
  type: NameSelection | undefined,
  countryNameList: string | string[] | undefined
): string | string[] | undefined {
  switch (type) {
    case "official":
      return Array.isArray(countryNameList)
        ? countryNameList[0]
        : countryNameList;
    case "all":
      return typeof countryNameList === "string"
        ? [countryNameList]
        : countryNameList;
    case "alias":
      return Array.isArray(countryNameList)
        ? countryNameList[1] || countryNameList[0]
        : countryNameList;
    default:
      throw new TypeError(
        "LocaleNameType must be one of these: all, official, alias!"
      );
  }
}

function resolveTerritoryCode(code: CountryCode): string | undefined {
  if (typeof code === "number") return toAlpha2(code);
  if (typeof code !== "string") return undefined;

  const value = code.trim();
  if (/^\d+$/.test(value)) {
    return numericToAlpha2(value) || territoryAliases[value] || value;
  }
  if (value.length === 3) {
    return alpha3ToAlpha2(value.toUpperCase()) || value.toUpperCase();
  }
  if (value.length === 2) {
    const territoryCode = value.toUpperCase();
    return territoryAliases[territoryCode] || territoryCode;
  }
  return undefined;
}

/** Register one explicitly imported BCP 47 locale data file. */
export function registerLocale(localeData: LocaleData): void {
  if (!localeData.locale) throw new TypeError("Missing localeData.locale");
  if (localeData.territories && localeData.countries) {
    throw new TypeError(
      "LocaleData must contain either territories or countries, not both"
    );
  }
  const territories = localeData.territories || localeData.countries;
  if (!territories) throw new TypeError("Missing localeData.territories");

  const locale = canonicalizeLocale(localeData.locale);
  if (!locale)
    throw new TypeError(`Invalid BCP 47 locale: ${localeData.locale}`);
  registeredLocales[locale] = territories;
}

export function alpha3ToAlpha2(code: string): string | undefined {
  return alpha3[code];
}

export function alpha2ToAlpha3(code: string): string | undefined {
  return alpha2[code];
}

export function alpha3ToNumeric(code: string): string | undefined {
  return invertedNumeric[alpha3ToAlpha2(code) as string];
}

export function alpha2ToNumeric(code: string): string | undefined {
  return invertedNumeric[code];
}

export function numericToAlpha3(code: number | string): string | undefined {
  return alpha2ToAlpha3(numeric[formatNumericCode(code)]);
}

export function numericToAlpha2(code: number | string): string | undefined {
  return numeric[formatNumericCode(code)];
}

export function toAlpha3(code: unknown): string | undefined {
  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) return numericToAlpha3(code);
    if (code.length === 2) return alpha2ToAlpha3(code.toUpperCase());
    if (code.length === 3) return code.toUpperCase();
  }
  return typeof code === "number" ? numericToAlpha3(code) : undefined;
}

export function toAlpha2(code: unknown): string | undefined {
  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) return numericToAlpha2(code);
    if (code.length === 2) return code.toUpperCase();
    if (code.length === 3) return alpha3ToAlpha2(code.toUpperCase());
  }
  return typeof code === "number" ? numericToAlpha2(code) : undefined;
}

export function getName(code: CountryCode, locale: string): string | undefined;
export function getName<T extends GetNameOptions>(
  code: CountryCode,
  locale: string,
  options: T
): CountryName<T> | undefined;
export function getName<T extends GetNameOptions>(
  code: CountryCode,
  locale: string,
  options: T = {} as T
): string | string[] | undefined {
  const selection = "select" in options ? options.select : "official";
  const entries = localeList(locale);
  const territoryCode = resolveTerritoryCode(code);
  return entries && territoryCode
    ? filterNameBy(selection, entries[territoryCode])
    : undefined;
}

export function getNames(
  locale: string
): LocalizedCountryNames<{ select: "official" }>;
export function getNames<T extends GetNameOptions>(
  locale: string,
  options: T
): LocalizedCountryNames<T>;
export function getNames<T extends GetNameOptions>(
  locale: string,
  options: T = {} as T
): LocaleList {
  const selection = "select" in options ? options.select : "official";
  const entries = localeList(locale);
  return entries
    ? localeFilter(
        entries,
        (nameList) => filterNameBy(selection, nameList) as string | string[]
      )
    : {};
}

function findTerritoryCode(
  name: string,
  locale: string,
  normalize: (value: string) => string
): string | undefined {
  const entries = localeList(locale);
  if (!entries) return undefined;
  for (const territoryCode in entries) {
    if (!hasOwnProperty(entries, territoryCode)) continue;
    const names = entries[territoryCode];
    const candidates = Array.isArray(names) ? names : [names];
    if (
      candidates.some((candidate) => normalize(candidate) === normalize(name))
    ) {
      return territoryCode;
    }
  }
  return undefined;
}

/** Find any CLDR territory identifier by its localized display name. */
export function getTerritoryCode(
  name: string,
  locale: string
): string | undefined {
  return findTerritoryCode(name, locale, (value) => value.toLowerCase());
}

export function getSimpleTerritoryCode(
  name: string,
  locale: string
): string | undefined {
  return findTerritoryCode(name, locale, (value) =>
    removeDiacritics(value.toLowerCase())
  );
}

export function getAlpha2Code(
  name: string,
  locale: string
): string | undefined {
  const code = getTerritoryCode(name, locale);
  return code && hasOwnProperty(alpha2, code) ? code : undefined;
}

export function getSimpleAlpha2Code(
  name: string,
  locale: string
): string | undefined {
  const code = getSimpleTerritoryCode(name, locale);
  return code && hasOwnProperty(alpha2, code) ? code : undefined;
}

export function getAlpha3Code(
  name: string,
  locale: string
): string | undefined {
  const alpha2Code = getAlpha2Code(name, locale);
  return alpha2Code ? toAlpha3(alpha2Code) : undefined;
}

export function getSimpleAlpha3Code(
  name: string,
  locale: string
): string | undefined {
  const alpha2Code = getSimpleAlpha2Code(name, locale);
  return alpha2Code ? toAlpha3(alpha2Code) : undefined;
}

export function getAlpha2Codes(): Record<string, string> {
  return alpha2;
}

export function getAlpha3Codes(): Record<string, string> {
  return alpha3;
}

export function getNumericCodes(): Record<string, string> {
  return numeric;
}

/** Return the canonical BCP 47 locales registered in this instance. */
export function langs(): string[] {
  return Object.keys(registeredLocales);
}

export function getSupportedLocales(): string[] {
  return localeMetadata.locales;
}

/** @deprecated Use getSupportedLocales for importable BCP 47 locale tags. */
export function getSupportedLanguages(): string[] {
  return [
    ...new Set(localeMetadata.locales.map((locale) => locale.split("-")[0])),
  ];
}

/** Check whether a value is a valid, officially assigned ISO 3166-1 code. */
export function isValid(code: unknown): boolean {
  if (!code) return false;
  const coerced = code.toString().toUpperCase();
  return (
    hasOwnProperty(alpha3, coerced) ||
    hasOwnProperty(alpha2, coerced) ||
    hasOwnProperty(numeric, coerced)
  );
}

/** Check whether a value is a CLDR territory identifier or an unambiguous alias. */
export function isValidTerritory(code: unknown): boolean {
  return (
    typeof code === "string" &&
    !!resolveTerritoryCode(code) &&
    territoryCodes.has(resolveTerritoryCode(code) as string)
  );
}
