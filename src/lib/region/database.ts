import { system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { ProxyDatabase } from 'lib/database/proxy'
import { t } from 'lib/text'
import { Area } from './areas/area'
import { SphereArea } from './areas/sphere'
import { RegionIsSaveable, type Region, type RegionPermissions } from './kinds/region'

export type RLDB = JsonObject | undefined

export interface RegionSave {
  /** Region type (area) */
  a: { t: string; d: JsonObject }

  /** Region subtype (kind) */
  k: string

  /** Linked database */
  ldb?: RLDB
  dimensionId: DimensionType
  permissions: Partial<RegionPermissions>
}

export const defaultRegionPermissions = (): RegionPermissions => ({
  doors: true,
  switches: true,
  openContainers: true,
  trapdoors: true,
  pvp: true,
  gates: true,
  allowedEntities: 'all',
  owners: [],
  allowedAllItem: true,
})

export const RegionDatabase = table<RegionSave>('region-v2', () => ({
  a: { t: SphereArea.type, d: {} },
  k: 'r',
  dimensionId: 'overworld',
  permissions: {},
}))

system.delay(() => {
  Object.entries(RegionDatabase).forEach(r => restoreRegionFromJSON(r))
})

let loaded = false
const kinds: (typeof Region)[] = []
export function registerSaveableRegion(kind: string, region: typeof Region) {
  if (loaded)
    throw new Error(
      `Registering region type ${kind} failed. Regions are already restored from json. Registering class should occur on the import-time.`,
    )

  // @ts-expect-error Yes, we ARE breaking typescript
  region.kind = kind
  // @ts-expect-error Yes, we ARE breaking typescript
  region.prototype[RegionIsSaveable] = true

  kinds.push(region)
}

export function restoreRegionFromJSON([key, region]: [string, (typeof RegionDatabase)[string]]) {
  Area.loaded = true
  loaded = true

  if (typeof region === 'undefined') return
  region = ProxyDatabase.unproxy(region)

  const kind = kinds.find(e => e.kind === region.k)
  if (!kind) {
    console.warn(t`[Region][Database] No kind found for ${region.k}. Maybe you forgot to register kind or import file?`)
    return
  }

  const area = Area.areas.find(e => e.type === region.a.t)
  if (!area) {
    console.warn(
      t`[Region][Database] No area found for ${region.a.t}. Maybe you forgot to register kind or import file?`,
    )
    return
  }

  return kind.create(new area(region.a.d), region, key)
}
