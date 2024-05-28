/* eslint-disable @typescript-eslint/naming-convention */
interface Modules {
  Net: null | typeof import('@minecraft/server-net')
}

export const ServerModules: Modules = /* @__PURE__ */ (() => {
  const ServerModules: Modules = {
    Net: null,
  }

  dynamicImport('@minecraft/server-net', 'Net')

  function dynamicImport(module: string, key: keyof typeof ServerModules) {
    import(module)
      .then(module => (ServerModules[key] = module))
      .catch(() => !__TEST__ && console.warn(`§7Not available§r: ${module}`))
  }

  return ServerModules
})()
