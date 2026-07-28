import assert from "node:assert/strict";
import { beforeAll, describe, it } from "vitest";
import en from "../locales/en.json";
import zhHans from "../locales/zh-Hans.json";
import zhHant from "../locales/zh-Hant.json";
import * as countries from "../src/index";

beforeAll(() => {
  countries.registerLocale(en);
  countries.registerLocale(zhHans);
  countries.registerLocale(zhHant);
});

describe("ISO 3166 conversions", () => {
  it("preserves alpha-2, alpha-3 and numeric conversions", () => {
    assert.equal(countries.toAlpha2("SGP"), "SG");
    assert.equal(countries.toAlpha3("sg"), "SGP");
    assert.equal(countries.numericToAlpha2(4), "AF");
    assert.equal(countries.numericToAlpha3("276"), "DEU");
    assert.equal(countries.alpha2ToNumeric("SE"), "752");
    assert.equal(countries.alpha3ToNumeric("SWE"), "752");
  });

  it("keeps ISO validation strict", () => {
    assert.equal(countries.isValid("SG"), true);
    assert.equal(countries.isValid("SGP"), true);
    assert.equal(countries.isValid(702), true);
    assert.equal(countries.isValid("fra"), true);
    assert.equal(countries.isValid("AC"), false);
    assert.equal(countries.isValid("XX"), false);
    assert.equal(countries.isValid(undefined), false);
    assert.equal(countries.isValid(null), false);
  });

  it("returns undefined for invalid conversions", () => {
    assert.equal(countries.toAlpha2(true), undefined);
    assert.equal(countries.toAlpha3("XX"), undefined);
    assert.equal(countries.alpha3ToAlpha2("XXX"), undefined);
    assert.equal(countries.alpha2ToAlpha3("XX"), undefined);
    assert.equal(countries.alpha2ToNumeric("XX"), undefined);
    assert.equal(countries.alpha3ToNumeric("XXX"), undefined);
    assert.equal(countries.numericToAlpha2("999"), undefined);
    assert.equal(countries.numericToAlpha3("999"), undefined);
  });

  it("supports every accepted conversion input shape and exposes code maps", () => {
    assert.equal(countries.toAlpha2("ac"), "AC");
    assert.equal(countries.toAlpha2(4), "AF");
    assert.equal(countries.toAlpha2(false), undefined);
    assert.equal(countries.toAlpha3("sgp"), "SGP");
    assert.equal(countries.toAlpha3(4), "AFG");
    assert.equal(countries.toAlpha3(false), undefined);
    assert.equal(Object.keys(countries.getAlpha2Codes()).length, 250);
    assert.equal(Object.keys(countries.getAlpha3Codes()).length, 250);
    assert.equal(Object.keys(countries.getNumericCodes()).length, 250);
  });
});

describe("CLDR territories", () => {
  it("resolves official ISO and CLDR-only territory identifiers", () => {
    assert.equal(countries.getName("USA", "en"), "United States");
    assert.equal(countries.getName("004", "en"), "Afghanistan");
    assert.equal(countries.getName(4, "en"), "Afghanistan");
    assert.equal(countries.getName("not-a-territory", "en"), undefined);
    assert.equal(countries.getName(null as never, "en"), undefined);
    for (const code of ["AC", "TA", "EU", "UN", "001", "419"]) {
      assert.notEqual(countries.getName(code, "en"), undefined, code);
      assert.equal(countries.isValidTerritory(code), true, code);
    }
    assert.equal(countries.isValidTerritory("UK"), true);
    assert.equal(countries.getName("uk", "en"), "United Kingdom");
    assert.equal(countries.isValidTerritory("AN"), false);
    assert.equal(countries.isValidTerritory("XX"), false);
    assert.equal(countries.isValidTerritory(419), false);
  });

  it("returns full CLDR territory display-name maps", () => {
    const names = countries.getNames("en");
    assert.equal(names.AC, "Ascension Island");
    assert.equal(names["001"], "world");
    assert.equal(countries.getTerritoryCode("world", "en"), "001");
    assert.equal(
      countries.getTerritoryCode("missing territory", "en"),
      undefined
    );
    assert.equal(countries.getAlpha2Code("United States", "en"), "US");
    assert.equal(countries.getAlpha3Code("United States", "en"), "USA");
    assert.equal(countries.getAlpha2Code("European Union", "en"), undefined);
  });
});

describe("BCP 47 locale behavior", () => {
  it("canonicalizes case and legacy underscore separators", () => {
    const expected = countries.getName("CN", "zh-Hans");
    assert.equal(countries.getName("CN", "ZH_hans_cn"), expected);
    assert.equal(countries.getName("CN", "zh-Hans-CN"), expected);
  });

  it("uses parent and structural locale fallback", () => {
    assert.equal(countries.getName("AU", "en-AU"), "Australia");
    assert.equal(countries.getName("US", "en-u-ca-gregory"), "United States");
    assert.equal(countries.getName("US", "en-oxendict"), "United States");
  });

  it("does not cross a script boundary during fallback", () => {
    countries.registerLocale({
      locale: "sr-Latn",
      territories: { RS: "Srbija (latinica)" },
    });
    assert.equal(countries.getName("RS", "sr-Cyrl"), undefined);
  });

  it("exposes importable locales and base languages", () => {
    assert.ok(countries.getSupportedLocales().includes("zh-Hans"));
    assert.ok(countries.getSupportedLocales().includes("pt-PT"));
    assert.ok(countries.getSupportedLanguages().includes("zh"));
  });

  it("returns no data for invalid or unregistered locales", () => {
    assert.equal(countries.getName("US", "invalid_@"), undefined);
    assert.deepEqual(countries.getNames("fr"), {});
  });
});

describe("locale registration compatibility", () => {
  it("accepts the legacy countries field", () => {
    countries.registerLocale({
      locale: "en-x-test",
      countries: { ZZ: "Testland" },
    });
    assert.equal(countries.getName("ZZ", "en-x-test"), "Testland");
    assert.equal(
      countries.getName("ZZ", "en-x-test", { select: "alias" }),
      "Testland"
    );
    assert.deepEqual(countries.getName("ZZ", "en-x-test", { select: "all" }), [
      "Testland",
    ]);
  });

  it("accepts territories and keeps selection behavior", () => {
    countries.registerLocale({
      locale: "en-x-select",
      territories: { ZZ: ["Official Testland", "Testland"] },
    });
    assert.equal(countries.getName("ZZ", "en-x-select"), "Official Testland");
    assert.equal(
      countries.getName("ZZ", "en-x-select", { select: "alias" }),
      "Testland"
    );
    assert.deepEqual(
      countries.getName("ZZ", "en-x-select", { select: "all" }),
      ["Official Testland", "Testland"]
    );
    assert.deepEqual(countries.getNames("en-x-select", { select: "all" }), {
      ZZ: ["Official Testland", "Testland"],
    });
    assert.equal(countries.getTerritoryCode("Testland", "en-x-select"), "ZZ");
    assert.throws(
      () =>
        countries.getName("ZZ", "en-x-select", { select: "invalid" } as never),
      /LocaleNameType/
    );
  });

  it("rejects conflicting, missing and invalid registrations", () => {
    assert.throws(
      () =>
        countries.registerLocale({
          locale: "en",
          countries: {},
          territories: {},
        }),
      /either territories or countries/
    );
    assert.throws(
      () => countries.registerLocale({ locale: "" }),
      /Missing localeData.locale/
    );
    assert.throws(
      () => countries.registerLocale({ locale: "en-x-empty" }),
      /Missing localeData.territories/
    );
    assert.throws(
      () => countries.registerLocale({ locale: "invalid_@", territories: {} }),
      /Invalid BCP 47 locale/
    );
  });

  it("supports diacritic-insensitive reverse lookup and ignores inherited entries", () => {
    const territories = Object.create({ AA: "Inherited" }) as Record<
      string,
      string
    >;
    territories.BE = "België";
    countries.registerLocale({ locale: "nl-x-test", territories });
    assert.equal(
      countries.getTerritoryCode("Inherited", "nl-x-test"),
      undefined
    );
    assert.equal(countries.getSimpleTerritoryCode("belgie", "nl-x-test"), "BE");
    assert.equal(countries.getSimpleAlpha2Code("belgie", "nl-x-test"), "BE");
    assert.equal(countries.getSimpleAlpha3Code("belgie", "nl-x-test"), "BEL");
  });

  it("prefers exact registrations and exposes registered locales", () => {
    countries.registerLocale({
      locale: "en-AU",
      territories: { AU: "Australia custom" },
    });
    assert.equal(countries.getName("AU", "en-AU"), "Australia custom");
    assert.ok(countries.langs().includes("en-AU"));
    assert.equal(countries.getName(" US ", "en"), "United States");
  });
});
