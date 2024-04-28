import { CubeRegion } from 'lib/Region/Class/CubeRegion.js'
import { BaseRegion, MineshaftRegion, RadiusRegion, SafeAreaRegion } from 'lib/Region/Class/RadiusRegion.js'
import { Region } from 'lib/Region/Class/Region.js'
import { REGION_DB } from './DB'

/**
 * RadiusRegions that can be restored from db
 */
const RadiusRegionSubTypes = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]
Object.values(REGION_DB).forEach(region => {
  if (region.t === 'c')
    Region.regions.push(
      new CubeRegion({
        ...region,
        creating: false,
      })
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
      })
    )
  }
})
