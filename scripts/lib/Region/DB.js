import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { DEFAULT_REGION_PERMISSIONS } from './config.js'
import { RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion, Region, CubeRegion } from './index.js'

/**
 * @typedef {{
 *  t: 'c'
 *  key: string;
 *  from: Point;
 *  to: Point;
 *  dimensionId: Dimensions;
 *  permissions: Partial<RegionPermissions>;
 * }} DB_CubeRegion
 */
/**
 * @typedef {{
 *  t: "r"
 *  st: string
 *  key: string;
 *  radius: number;
 *  center: Vector3;
 *  dimensionId: Dimensions;
 *  permissions: Partial<RegionPermissions>;
 * }} DB_RadiusRegion
 */

/**
 * RadiusRegions that can be restored from db
 */
const RadiusRegionSubTypes = [RadiusRegion, MineshaftRegion, SafeAreaRegion, BaseRegion]

export const REGION_DB = new DynamicPropertyDB('region', {
  /** @returns {Partial<DB_RadiusRegion | DB_CubeRegion>} */
  defaultValue: key => {
    return {
      dimensionId: 'overworld',
      permissions: DEFAULT_REGION_PERMISSIONS,
      key,
    }
  },
}).proxy()

Object.values(REGION_DB).forEach(region => {
  if (region.t === 'c')
    Region.regions.push(
      new CubeRegion({
        ...region,
        creating: false,
      })
    )
  else {
    const RadiusRegionSubtype = RadiusRegionSubTypes.find(e => e.prototype.subtype === region.st) ?? RadiusRegion

    Region.regions.push(
      new RadiusRegionSubtype({
        ...region,
        creating: false,
      })
    )
  }
})
