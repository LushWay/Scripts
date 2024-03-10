export const BDS = {
  /**
   * Module not avaible on common worlds, so using boilerplate
   * @type {typeof import("@minecraft/server-admin") | false}
   */
  ServerAdmin: false,
  /**
   * Module not avaible on common worlds, so using boilerplate
   * @type {typeof import("@minecraft/server-net") | false}
   */
  ServerNet: false,
}

dynamicImport('@minecraft/server-admin', 'ServerAdmin')
dynamicImport('@minecraft/server-net', 'ServerNet')

/**
 * @param {string} module
 * @param {keyof typeof BDS} key
 */
function dynamicImport(module, key) {
  import(module)
    .then(module => (BDS[key] = module))
    .catch(() => console.warn(`§7Not available§r: ${module}`))
}
