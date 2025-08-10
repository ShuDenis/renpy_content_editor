/**
 * При прошлых запусках появлялась ошибка TS2304:
 * "Cannot find name 'global'".
 * Вместо `global` используем `globalThis`, который
 * всегда определён и в браузере, и в Node.
 */
;(globalThis as any).fetch = () => Promise.resolve({ json: () => Promise.resolve({}) })

export {}
