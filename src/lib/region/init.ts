import { RegionDatabase } from './database'
import { CubeRegion } from './kinds/CubeRegion'
import { BaseRegion, MineshaftRegion, RadiusRegion, SafeAreaRegion } from './kinds/RadiusRegion'
import { Region } from './kinds/Region'

const RadiusRegionSubTypes = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]
Object.values(RegionDatabase).forEach(region => {
  if (!region) return
  if (region.t === 'c')
    Region.regions.push(
      new CubeRegion({
        ...region,
        creating: false,
      }),
    )
  else {
    const RadiusRegionSubtype =
      RadiusRegionSubTypes.find(e => {
        const subtype = e.subtype

        return subtype === region.st
      }) ?? RadiusRegion

    Region.regions.push(
      new RadiusRegionSubtype({
        ...region,
        creating: false,
        subclassing: RadiusRegionSubtype !== RadiusRegion,
      }),
    )
  }
})
