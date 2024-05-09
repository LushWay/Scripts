import { CubeRegion } from 'lib/region/Class/CubeRegion'
import { BaseRegion, MineshaftRegion, RadiusRegion, SafeAreaRegion } from 'lib/region/Class/RadiusRegion'
import { Region } from 'lib/region/Class/Region'
import { REGION_DB } from './DB'

const RadiusRegionSubTypes = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]
Object.values(REGION_DB).forEach(region => {
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
