import { BaseRegion } from '../../modules/places/base/BaseRegion'
import { MineshaftRegion } from '../../modules/places/mineshaft/MineshaftRegion'
import { RegionDatabase } from './database'
import { CubeRegion } from './kinds/CubeRegion'
import { RadiusRegion } from './kinds/RadiusRegion'
import { SafeAreaRegion } from './kinds/SafeAreaRegion'

Object.entries(RegionDatabase).forEach(r => restoreRegionFromJSON(r))

export function restoreRegionFromJSON(
  [key, region]: [string, (typeof RegionDatabase)[string]],
  kinds = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion],
) {
  let created
  if (!region) return
  if (region.t === 'c') created = CubeRegion.create(region, key)
  else {
    const RadiusRegionKind = kinds.find(e => e.kind === region.st) ?? RadiusRegion
    created = RadiusRegionKind.create(region, key)
  }

  return created
}
