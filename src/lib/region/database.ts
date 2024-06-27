import { system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import type { Region, RegionPermissions } from './Region'

export type RLDB = JsonObject | undefined

export interface RegionSave {
  /** Region type */
  t: string
  /** Linked database */
  ldb?: RLDB
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export interface CubeRegionSave extends RegionSave {
  t: 'c'
  st: string
  from: VectorXZ
  to: VectorXZ
}

export interface RadiusRegionSave extends RegionSave {
  t: 'r'
  st: string
  radius: number
  center: Vector3
}

export const RegionDatabase = table<CubeRegionSave | RadiusRegionSave>('region', () => ({
  t: 'r',
  permissions: {},
  dimensionId: 'overworld',
  center: { x: 0, y: 0, z: 0 },
  st: 'radius',
  radius: 0,
}))

system.delay(() => {
  Object.entries(RegionDatabase).forEach(r => restoreRegionFromJSON(r))
})

let loaded = false
const kinds: (typeof Region)[] = []

export function registerRegionType(region: typeof Region) {
  if (loaded)
    throw new Error(
      `Registering region type ${region.kind} failed. Regions are already restored from json. Registering class should occur on the import-time.`,
    )

  kinds.push(region)
}

export function restoreRegionFromJSON([key, region]: [string, (typeof RegionDatabase)[string]]) {
  loaded = true

  if (typeof region === 'undefined') return
  region = ProxyDatabase.unproxy(region)

  const kind =  kinds.find(e => e.type === region.t && e.kind === region.st) ?? kinds[0]
  return kind.create(region, key)
}
