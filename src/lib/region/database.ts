import { table } from 'lib/database/abstract'
import { RegionPermissions } from './Region'

export type RLDB = JsonObject | undefined

export interface RegionSave {
  /** Region type */
  t: string
  /** Linked database */
  ldb?: RLDB
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export interface CubeRegionSave extends RegionSave {
  t: 'c'
  from: VectorXZ
  to: VectorXZ
}

export interface RadiusRegionSave extends RegionSave {
  t: 'r'
  st: string
  radius: number
  center: Vector3
}

export const RegionDatabase = table<CubeRegionSave | RadiusRegionSave>('region', () => ({
  t: 'r',
  permissions: {},
  dimensionId: 'overworld',
  center: { x: 0, y: 0, z: 0 },
  st: 'radius',
  radius: 0,
}))
