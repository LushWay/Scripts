import { CubeRegion } from 'lib/Region/Class/CubeRegion'
import { BaseRegion, MineshaftRegion, RadiusRegion, SafeAreaRegion } from 'lib/Region/Class/RadiusRegion'
import { Region } from 'lib/Region/Class/Region'
import { REGION_DB } from './DB'
/** RadiusRegions that can be restored from db */
const RadiusRegionSubTypes = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]
Object.values(REGION_DB).forEach(region => {
  // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
  if (region.t === 'c')
    Region.regions.push(
      // @ts-expect-error TS(2345) FIXME: Argument of type 'CubeRegion' is not assignable to... Remove this comment to see the full error message
      new CubeRegion({
        // @ts-expect-error TS(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
        ...region,
        creating: false,
      }),
    )
  else {
    const RadiusRegionSubtype =
      RadiusRegionSubTypes.find(e => {
        const subtype = e.subtype

        // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
        return subtype === region.st
      }) ?? RadiusRegion

    Region.regions.push(
      // @ts-expect-error TS(2345) FIXME: Argument of type 'RadiusRegion | MineshaftRegion' ... Remove this comment to see the full error message
      new RadiusRegionSubtype({
        // @ts-expect-error TS(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
        ...region,
        creating: false,
        subclassing: RadiusRegionSubtype !== RadiusRegion,
      }),
    )
  }
})
