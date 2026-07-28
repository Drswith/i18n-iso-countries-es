# i18n-iso-countries-es

[![CI](https://github.com/Drswith/i18n-cldr-territories/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Drswith/i18n-cldr-territories/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/i18n-iso-countries-es)](https://www.npmjs.com/package/i18n-iso-countries-es)
[![npm downloads](https://img.shields.io/npm/dm/i18n-iso-countries-es)](https://www.npmjs.com/package/i18n-iso-countries-es)
[![License](https://img.shields.io/npm/l/i18n-iso-countries-es)](https://github.com/Drswith/i18n-cldr-territories/blob/main/LICENSE)
[![Node.js](https://img.shields.io/node/v/i18n-iso-countries-es)](https://github.com/Drswith/i18n-cldr-territories/blob/main/package.json)

i18n for ISO 3166-1 country codes. We support Alpha-2, Alpha-3 and Numeric codes from ['Wikipedia: Officially assigned code elements'][iso:3166-1]

## Status: frozen after v1.0.2

`i18n-iso-countries-es` is frozen after `1.0.2`. It will not receive further
feature, locale, or data updates.

Its successor is
[`i18n-cldr-territories`](https://www.npmjs.com/package/i18n-cldr-territories),
maintained at
[`Drswith/i18n-cldr-territories`](https://github.com/Drswith/i18n-cldr-territories).
The successor is an independent CLDR-based package; it supports BCP 47 locale
tags, CLDR territory identifiers such as `AC` and `TA`, script-aware locale
fallback, and explicit locale registration.

To migrate:

```sh
pnpm remove i18n-iso-countries-es
pnpm add i18n-cldr-territories
```

This v1 package continues to expose only its existing ISO 3166-1 data and
ISO 639-1 locale model. See the successor README for the complete migration
guide and its explicit `registerLocale()` usage.

## Installing

Install it using pnpm: `pnpm add i18n-iso-countries-es`

The package publishes multiple runtime formats:

- CommonJS: `require("i18n-iso-countries-es")` uses the Node entry and
  pre-registers all locales.
- ESM: `import * as countries from "i18n-iso-countries-es"` is the portable
  browser, Edge, Deno, and Bun entry; register only the locales you need.
- Browser globals: `dist/browser.iife.js` and `dist/browser.umd.js` expose
  `I18nIsoCountries` for direct `<script>` and CDN usage.

```javascript
var countries = require("i18n-iso-countries-es");
```

If you use `i18n-iso-countries-es` with Node.js, you are done. If you use the package in a browser environment, you have to register the languages you want to use to minimize the file size.

```javascript
// Support french & english languages.
countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
countries.registerLocale(require("i18n-iso-countries-es/langs/fr.json"));
```

## Code to Country

### Get the name of a country by its ISO 3166-1 Alpha-2, Alpha-3 or Numeric code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("US (Alpha-2) => " + countries.getName("US", "en")); // United States of America
console.log("US (Alpha-2) => " + countries.getName("US", "de")); // Vereinigte Staaten von Amerika
console.log("USA (Alpha-3) => " + countries.getName("USA", "en")); // United States of America
console.log("USA (Numeric) => " + countries.getName("840", "en")); // United States of America
```

#### Get aliases/short name using select

```javascript
// Some countries have alias/short names defined. `select` is used to control which
// name will be returned.
console.log("GB (select: official) => " + countries.getName("GB", "en", {select: "official"})); // United Kingdom
console.log("GB (select: alias) => " + countries.getName("GB", "en", {select: "alias"})); // UK
console.log("GB (select: all) => " + countries.getName("GB", "en", {select: "all"})); // ["United Kingdom", "UK", "Great Britain"]
// Countries without an alias will always return the offical name
console.log("LT (select: official) => " + countries.getName("LT", "en", {select: "official"})); // Lithuania
console.log("LT (select: alias) => " + countries.getName("LT", "en", {select: "alias"})); // Lithuania
console.log("LT (select: all) => " + countries.getName("LT", "en", {select: "all"})); // ["Lithuania"]
```

### Get all names by their ISO 3166-1 Alpha-2 code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.getNames("en", {select: "official"})); // { 'AF': 'Afghanistan', 'AL': 'Albania', [...], 'ZM': 'Zambia', 'ZW': 'Zimbabwe' }
```

### Supported languages (ISO 639-1)

> In case you want to add new language, please refer [ISO 639-1 table][iso:639-1].

- `af`: Afrikaans
- `am`: Amharic
- `ar`: Arabic
- `az`: Azerbaijani
- `be`: Belorussian
- `bg`: Bulgarian
- `bn`: Bengali
- `br`: Breton
- `bs`: Bosnian
- `ca`: Catalan
- `cs`: Czech
- `cy`: Cymraeg
- `da`: Danish
- `de`: German
- `dv`: Dhivehi
- `en`: English
- `es`: Spanish
- `et`: Estonian
- `eu`: Basque
- `fa`: Persian
- `fi`: Finnish
- `fr`: French
- `ga`: Irish
- `gl`: Galician
- `el`: Greek
- `ha`: Hausa
- `he`: Hebrew
- `hi`: Hindi
- `hr`: Croatian
- `hu`: Hungarian
- `hy`: Armenian
- `is`: Icelandic
- `it`: Italian
- `id`: Indonesian
- `ja`: Japanese
- `ka`: Georgian
- `kk`: Kazakh
- `km`: Khmer
- `ko`: Korean
- `ku`: Kurdish
- `ky`: Kyrgyz
- `lt`: Lithuanian
- `lv`: Latvian
- `mk`: Macedonian
- `ml`: Malayalam
- `mn`: Mongolian
- `mr`: Marathi
- `ms`: Malay
- `mt`: Maltese
- `nb`: Norwegian Bokmål
- `nl`: Dutch
- `nn`: Norwegian Nynorsk
- `no`: Norwegian
- `pl`: Polish
- `ps`: Pashto
- `pt`: Portuguese
- `ro`: Romanian
- `ru`: Russian
- `sd`: Sindhi
- `sk`: Slovak
- `sl`: Slovene
- `so`: Somali
- `sq`: Albanian
- `sr`: Serbian
- `sv`: Swedish
- `sw`: Swahili
- `ta`: Tamil
- `tg`: Tajik
- `th`: Thai
- `tk`: Turkmen
- `tr`: Turkish
- `tt`: Tatar
- `ug`: Uyghur
- `uk`: Ukrainian
- `ur`: Urdu
- `uz`: Uzbek
- `zh`: Chinese
- `vi`: Vietnamese

[List of ISO 639-1 codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

### Get all supported languages (ISO 639-1)

```javascript
var countries = require("i18n-iso-countries-es");
console.log("List of supported languages => " + countries.getSupportedLanguages());
// List of supported languages => ["cy", "dv", "sw", "eu", "af", "am", ...]
```

### Country to Code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("United States of America => " + countries.getAlpha2Code("United States of America", "en"));
// United States of America => US

console.log("United States of America => " + countries.getAlpha3Code("United States of America", "en"));
// United States of America => USA
```

## Codes

### Convert Alpha-3 to Alpha-2 code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("USA (Alpha-3) => " + countries.alpha3ToAlpha2("USA") + " (Alpha-2)");
// USA (Alpha-3) => US (Alpha-2)
```

### Convert Numeric to Alpha-2 code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("840 (Numeric) => " + countries.numericToAlpha2("840") + " (Alpha-2)");
// 840 (Numeric) => US (Alpha-2)
```

### Convert Alpha-2 to Alpha-3 code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("DE (Alpha-2) => " + countries.alpha2ToAlpha3("DE") + " (Alpha-3)");
// DE (Alpha-2) => DEU (Alpha-3)
```

### Convert Numeric to Alpha-3 code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log("840 (Numeric) => " + countries.numericToAlpha3("840") + " (Alpha-3)");
// 840 (Numeric) => USA (Alpha-3)
```

### Convert Alpha-3 to Numeric code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.alpha3ToNumeric("SWE"));
// 752
```

### Convert Alpha-2 to Numeric code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.alpha2ToNumeric("SE"));
// 752
```

### Get all Alpha-2 codes

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.getAlpha2Codes());
// { 'AF': 'AFG', 'AX': 'ALA', [...], 'ZM': 'ZMB', 'ZW': 'ZWE' }
```

### Get all Alpha-3 codes

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.getAlpha3Codes());
// { 'AFG': 'AF', 'ALA': 'AX', [...], 'ZMB': 'ZM', 'ZWE': 'ZW' }
```

### Get all Numeric codes

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(countries.getNumericCodes());
// { '004': 'AF', '008': 'AL', [...], '887': 'YE', '894': 'ZM' }
```

### Validate country code

```javascript
var countries = require("i18n-iso-countries-es");
// in a browser environment: countries.registerLocale(require("i18n-iso-countries-es/langs/en.json"));
console.log(
  countries.isValid("US"),
  countries.isValid("USA"),
  countries.isValid("XX")
);
// true, true, false
```

## Contribution

To add a language:

- add a json file under [langs/](langs)
- add the language to the list in supportedLocales.json at the top
- add language to section **Supported languages** in [README.md](#supported-languages-iso-639-1)
- add language to keywords in [package.json](package.json)
- run `pnpm run check`
- open a PR on GitHub

## Development

The repository uses Node.js 24.11 or newer for development and pnpm 11.15.1.
The published package remains compatible with Node.js 12 and newer.

```sh
pnpm install
pnpm run check
```

You can check codes here: https://www.iso.org/obp/ui/#home

[iso:639-1]: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
[iso:3166-1]: http://en.wikipedia.org/wiki/ISO_3166-1#Officially_assigned_code_elements
