/* eslint-disable @typescript-eslint/naming-convention */

export const BDS: {
  ServerAdmin: null | typeof import('@minecraft/server-admin')
  ServerNet: null | typeof import('@minecraft/server-net')
} = {
  ServerAdmin: null,
  ServerNet: null,
}

dynamicImport('@minecraft/server-admin', 'ServerAdmin')
dynamicImport('@minecraft/server-net', 'ServerNet')

function dynamicImport(module: string, key: keyof typeof BDS) {
  import(module).then(module => (BDS[key] = module)).catch(() => console.warn(`§7Not available§r: ${module}`))
}
