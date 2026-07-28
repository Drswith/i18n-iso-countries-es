import { remove as removeDiacritics } from "diacritics";
import codesJson from "../codes.json";
import supportedLocalesJson from "../supportedLocales.json";

export type Alpha2Code = string;
export type Alpha3Code = string;
export type CountryCode = Alpha2Code | Alpha3Code | string | number;
export type NameSelection = "all" | "official" | "alias";

export interface GetNameOptions {
  select?: NameSelection;
}

export type CountryName<T extends GetNameOptions> = T["select"] extends "all"
  ? string[]
  : string;

export type LocalizedCountryNames<T extends GetNameOptions = GetNameOptions> =
  Record<string, CountryName<T>>;

export interface LocaleData {
  locale: string;
  countries: Record<string, string | string[]>;
}

type CodeInformation = readonly [
  alpha2: string,
  alpha3: string,
  numeric: string,
  iso3166_2: string,
];
type LocaleList = Record<string, string | string[]>;

const codes = codesJson as unknown as readonly CodeInformation[];
const supportedLocales = supportedLocalesJson as string[];
const registeredLocales: Record<string, LocaleList> = {};
const alpha2: Record<string, string> = {};
const alpha3: Record<string, string> = {};
const numeric: Record<string, string> = {};
const invertedNumeric: Record<string, string> = {};

/*
 * All codes map to ISO 3166-1 alpha-2.
 */
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

/**
 * Avoid using obj.hasOwnProperty directly as `hasOwnProperty` could be a
 * property in itself ({ hasOwnProperty: 1 }).
 */
function hasOwnProperty(object: object, property: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function localeFilter(
  localeList: LocaleList,
  filter: (nameList: string | string[], alpha2Code: string) => string | string[]
): LocaleList {
  const newLocaleList: LocaleList = {};
  for (const alpha2Code of Object.keys(localeList)) {
    newLocaleList[alpha2Code] = filter(localeList[alpha2Code], alpha2Code);
  }
  return newLocaleList;
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

/** Register a locale for use in browser environments. */
export function registerLocale(localeData: LocaleData): void {
  if (!localeData.locale) {
    throw new TypeError("Missing localeData.locale");
  }

  if (!localeData.countries) {
    throw new TypeError("Missing localeData.countries");
  }

  registeredLocales[localeData.locale] = localeData.countries;
}

/** Convert an ISO 3166-1 alpha-3 code to alpha-2. */
export function alpha3ToAlpha2(code: string): string | undefined {
  return alpha3[code];
}

/** Convert an ISO 3166-1 alpha-2 code to alpha-3. */
export function alpha2ToAlpha3(code: string): string | undefined {
  return alpha2[code];
}

/** Convert an ISO 3166-1 alpha-3 code to a numeric code. */
export function alpha3ToNumeric(code: string): string | undefined {
  return invertedNumeric[alpha3ToAlpha2(code) as string];
}

/** Convert an ISO 3166-1 alpha-2 code to a numeric code. */
export function alpha2ToNumeric(code: string): string | undefined {
  return invertedNumeric[code];
}

/** Convert a numeric code to alpha-3. */
export function numericToAlpha3(code: number | string): string | undefined {
  const padded = formatNumericCode(code);
  return alpha2ToAlpha3(numeric[padded]);
}

/** Convert a numeric code to alpha-2. */
export function numericToAlpha2(code: number | string): string | undefined {
  const padded = formatNumericCode(code);
  return numeric[padded];
}

/** Convert an alpha-2, alpha-3, or numeric code to alpha-3. */
export function toAlpha3(code: unknown): string | undefined {
  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) {
      return numericToAlpha3(code);
    }
    if (code.length === 2) {
      return alpha2ToAlpha3(code.toUpperCase());
    }
    if (code.length === 3) {
      return code.toUpperCase();
    }
  }
  if (typeof code === "number") {
    return numericToAlpha3(code);
  }
  return undefined;
}

/** Convert an alpha-2, alpha-3, or numeric code to alpha-2. */
export function toAlpha2(code: unknown): string | undefined {
  if (typeof code === "string") {
    if (/^[0-9]*$/.test(code)) {
      return numericToAlpha2(code);
    }
    if (code.length === 2) {
      return code.toUpperCase();
    }
    if (code.length === 3) {
      return alpha3ToAlpha2(code.toUpperCase());
    }
  }
  if (typeof code === "number") {
    return numericToAlpha2(code);
  }
  return undefined;
}

export function getName(code: CountryCode, lang: string): string | undefined;
export function getName<T extends GetNameOptions>(
  code: CountryCode,
  lang: string,
  options: T
): CountryName<T> | undefined;
export function getName<T extends GetNameOptions>(
  code: CountryCode,
  lang: string,
  options: T = {} as T
): string | string[] | undefined {
  const selection = "select" in options ? options.select : "official";
  try {
    const codeMaps = registeredLocales[lang.toLowerCase()];
    const nameList = codeMaps[toAlpha2(code) as string];
    return filterNameBy(selection, nameList);
  } catch {
    return undefined;
  }
}

export function getNames(
  lang: string
): LocalizedCountryNames<{ select: "official" }>;
export function getNames<T extends GetNameOptions>(
  lang: string,
  options: T
): LocalizedCountryNames<T>;
export function getNames<T extends GetNameOptions>(
  lang: string,
  options: T = {} as T
): LocaleList {
  const selection = "select" in options ? options.select : "official";
  const localeList = registeredLocales[lang.toLowerCase()];
  if (localeList === undefined) {
    return {};
  }
  return localeFilter(
    localeList,
    (nameList) => filterNameBy(selection, nameList) as string | string[]
  );
}

function findAlpha2Code(
  name: string,
  lang: string,
  normalize: (value: string) => string
): string | undefined {
  const codenames = registeredLocales[lang.toLowerCase()];
  for (const alpha2Code in codenames) {
    if (!hasOwnProperty(codenames, alpha2Code)) {
      continue;
    }
    const countryNames = codenames[alpha2Code];
    if (typeof countryNames === "string") {
      if (normalize(countryNames) === normalize(name)) {
        return alpha2Code;
      }
      continue;
    }
    for (const countryName of countryNames) {
      if (normalize(countryName) === normalize(name)) {
        return alpha2Code;
      }
    }
  }
  return undefined;
}

/** Find an alpha-2 code by its localized country name. */
export function getAlpha2Code(name: string, lang: string): string | undefined {
  try {
    return findAlpha2Code(name, lang, (value) => value.toLowerCase());
  } catch {
    return undefined;
  }
}

/** Find an alpha-2 code while ignoring diacritics. */
export function getSimpleAlpha2Code(
  name: string,
  lang: string
): string | undefined {
  try {
    return findAlpha2Code(name, lang, (value) =>
      removeDiacritics(value.toLowerCase())
    );
  } catch {
    return undefined;
  }
}

/** Return an object of alpha-2 codes mapped to alpha-3 codes. */
export function getAlpha2Codes(): Record<string, string> {
  return alpha2;
}

/** Find an alpha-3 code by its localized country name. */
export function getAlpha3Code(name: string, lang: string): string | undefined {
  const alpha2Code = getAlpha2Code(name, lang);
  return alpha2Code ? toAlpha3(alpha2Code) : undefined;
}

/** Find an alpha-3 code while ignoring diacritics. */
export function getSimpleAlpha3Code(
  name: string,
  lang: string
): string | undefined {
  const alpha2Code = getSimpleAlpha2Code(name, lang);
  return alpha2Code ? toAlpha3(alpha2Code) : undefined;
}

/** Return an object of alpha-3 codes mapped to alpha-2 codes. */
export function getAlpha3Codes(): Record<string, string> {
  return alpha3;
}

/** Return an object of numeric codes mapped to alpha-2 codes. */
export function getNumericCodes(): Record<string, string> {
  return numeric;
}

/** Return the locales registered in this instance. */
export function langs(): string[] {
  return Object.keys(registeredLocales);
}

/** Return all locales supported by the package. */
export function getSupportedLanguages(): string[] {
  return supportedLocales;
}

/** Check whether a value is a valid ISO 3166-1 code. */
export function isValid(code: unknown): boolean {
  if (!code) {
    return false;
  }

  const coerced = code.toString().toUpperCase();
  return (
    hasOwnProperty(alpha3, coerced) ||
    hasOwnProperty(alpha2, coerced) ||
    hasOwnProperty(numeric, coerced)
  );
}
