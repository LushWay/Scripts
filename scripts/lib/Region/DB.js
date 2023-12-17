import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { DEFAULT_REGION_PERMISSIONS } from './config.js'
// eslint-disable-next-line scriptapi/no-cycle

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
