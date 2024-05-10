import { RegionDatabase } from './database'
import { BaseRegion } from './kinds/BaseRegion'
import { CubeRegion } from './kinds/CubeRegion'
import { MineshaftRegion } from './kinds/MineshaftRegion'
import { RadiusRegion } from './kinds/RadiusRegion'
import { SafeAreaRegion } from './kinds/SafeAreaRegion'

const RadiusRegionKinds = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]
Object.entries(RegionDatabase).forEach(restoreRegionFromJSON)

export function restoreRegionFromJSON([key, region]: [string, (typeof RegionDatabase)[string]]) {
  let created
  if (!region) return
  if (region.t === 'c') created = CubeRegion.create(region, key, false)
  else {
    const RadiusRegionKind =
      RadiusRegionKinds.find(e => {
        const subtype = e.kind

        return subtype === region.st
      }) ?? RadiusRegion

    created = RadiusRegionKind.create(region, key, false)
  }

  return created
}
