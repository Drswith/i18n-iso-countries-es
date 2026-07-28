# i18n-iso-countries-es

CLDR-powered locale and territory display names for ISO 3166-1 country codes,
CLDR territories, and BCP 47 locales.

This is a v2 rewrite of the `Drswith/i18n-iso-countries-es` fork of
[`michaelwittig/node-i18n-iso-countries`](https://github.com/michaelwittig/node-i18n-iso-countries).
It uses Unicode CLDR 48.2 data and is released under this package's MIT license
plus the [Unicode-3.0 data license](LICENSE-CLDR).

## Install

```sh
pnpm add i18n-iso-countries-es
```

## Usage

Locale data is intentionally not preloaded. Import only the BCP 47 locale files
your application needs and register them explicitly.

```ts
import * as countries from "i18n-iso-countries-es";
import en from "i18n-iso-countries-es/locales/en.json" with { type: "json" };
import zhHans from "i18n-iso-countries-es/locales/zh-Hans.json" with {
  type: "json",
};

countries.registerLocale(en);
countries.registerLocale(zhHans);

countries.getName("USA", "en"); // United States
countries.getName("CN", "zh-Hans"); // 中国
countries.getName("AC", "en"); // Ascension Island
countries.getName("419", "zh-Hans"); // 拉丁美洲
```

With CommonJS, load the same JSON files through `require()` before calling
`registerLocale()`.

## Locale model

Locale inputs follow [BCP 47](https://www.rfc-editor.org/rfc/rfc5646):

- languages and variants: `en`, `pt-PT`
- scripts: `zh-Hans`, `zh-Hant`
- regions: `en-AU`, `zh-Hans-CN`

Case differences and legacy underscore separators are normalized, so
`ZH_hans_cn` resolves as `zh-Hans-CN`. Lookup first uses an exact registered
locale, then CLDR parent locales. Script subtags are never silently removed:
`zh-Hant` will not fall back to simplified `zh` data.

`getSupportedLocales()` lists the importable locale files. The older
`getSupportedLanguages()` API remains available but is deprecated in favor of
the BCP 47 locale list.

## Territory model

`getName()` and `getNames()` expose all CLDR territory display names, including
official ISO 3166-1 entries, territories such as `AC` and `TA`, special entries
such as `EU` and `UN`, and UN M.49 macroregions such as `001` and `419`.

ISO conversion APIs remain strict:

```ts
countries.alpha3ToAlpha2("USA"); // US
countries.numericToAlpha3("840"); // USA
countries.isValid("AC"); // false: not an officially assigned ISO 3166-1 code
countries.isValidTerritory("AC"); // true: a CLDR territory identifier
countries.getTerritoryCode("world", "en"); // 001
```

`getAlpha2Code()` and `getAlpha3Code()` remain ISO-only. Use
`getTerritoryCode()` for any CLDR territory identifier.

## Migration from v1

v2 is a breaking release:

- Node no longer pre-registers every locale; register imported locale JSON.
- Locale JSON now has a `territories` object. `registerLocale()` still accepts
  the former `countries` object for custom locale migration, but the generated
  locale files only use `territories`.
- CLDR display names replace the former hand-maintained translations. Exact
  wording can differ from v1.
- `langs/*.json` and `supportedLocales.json` are replaced by
  `locales/*.json` and `getSupportedLocales()`.

## Data updates

The checked-in generated data is pinned to `cldr-localenames-full@48.2.0` and
`cldr-core@48.2.0`. To update it, first deliberately change both pinned
versions, install dependencies, then pass the installed version explicitly:

```sh
pnpm cldr:update -- <cldr-version>
pnpm check
```

`pnpm cldr:check` is included in `pnpm check` and fails when the committed
locale files no longer match the pinned CLDR source.

## Development

```sh
pnpm install
pnpm check
```
