import { system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { t } from 'lib/text'
import type { Region, RegionPermissions } from './kinds/region'

export type RLDB = JsonObject | undefined

export interface RegionSave {
  /** Region type */
  t: string

  /** Region subtype (kind) */
  st: string

  /** Linked database */
  ldb?: RLDB
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export interface CubeRegionSave extends RegionSave {
  t: 'c'
  from: VectorXZ
  to: VectorXZ
}

export interface RadiusRegionSave extends RegionSave {
  t: 'r'
  radius: number
  center: Vector3
}

export const RegionDatabase = table<CubeRegionSave | RadiusRegionSave | RegionSave>('region', () => ({
  t: 'r',
  st: 'radius',
  permissions: {},
  dimensionId: 'overworld',
  center: { x: 0, y: 0, z: 0 },
  radius: 0,
}))

system.delay(() => {
  Object.entries(RegionDatabase).forEach(r => restoreRegionFromJSON(r))
})

let loaded = false
const kinds: (typeof Region)[] = []
export function registerRegionKind(region: typeof Region) {
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

  const kind = kinds.find(e => e.type === region.t && e.kind === region.st)
  if (!kind) {
    console.warn(
      t`[Region][Database] No kind found for ${region.t} -> ${region.st}. Maybe you forgot to register kind or import file?`,
    )
    return
  }
  return kind.create(region, key)
}
