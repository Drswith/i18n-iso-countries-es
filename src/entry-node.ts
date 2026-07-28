import * as library from "./index";
import type { LocaleData } from "./index";

const supportedLocales = library.getSupportedLanguages();

for (const localeName of supportedLocales) {
  const locale = require(`../langs/${localeName}.json`) as LocaleData;
  library.registerLocale(locale);
}

export * from "./index";
