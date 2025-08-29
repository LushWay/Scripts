import { system } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { deepClone } from 'lib/database/defaults'
import { EventLoader } from 'lib/event-signal'
import { noI18n } from 'lib/i18n/text'
import { Area } from './areas/area'
import './areas/cut'
import { SphereArea } from './areas/sphere'
import { RegionEvents } from './events'
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
  system.runJob(
    (function* regionRestore() {
      let i = 0
      for (const r of RegionDatabase.entriesImmutable()) {
        restoreRegionFromJSON(r)
        i++
        if (i % 100 === 0) yield
      }
      EventLoader.load(RegionEvents.onLoad)
    })(),
  )
})

let loaded = false
let kinds: (typeof Region)[] = []
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TEST_clearSaveableRegions() {
  loaded = false
  kinds = []
}

export function restoreRegionFromJSON([key, regionImmutable]: [string, Immutable<RegionSave>]) {
  loaded = true

  if (typeof regionImmutable === 'undefined') return
  const region = deepClone(regionImmutable) as RegionSave

  const kind = kinds.find(e => e.kind === region.k)
  if (!kind) {
    console.warn(
      noI18n`[Region][Database] No kind found for ${region.k}. Available kinds: ${kinds.map(e => e.kind).join(', ')}. Maybe you forgot to register kind or import file?`,
    )
    return
  }

  const area = Area.fromJson(region.a)
  if (!area) return

  if (!area.isValid()) {
    console.warn('[Region][Database] Area', area.toString(), 'is invalid')
    return
  }

  return kind.create(area, region, key)
}
