import { table } from 'lib/database/abstract'
import { RegionPermissions } from './Region'

type CubeRegionSave = {
  t: 'c'
  from: VectorXZ
  to: VectorXZ
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

type RadiusRegionSave = {
  t: 'r'
  st: string
  radius: number
  center: Vector3
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export const RegionDatabase = table<CubeRegionSave | RadiusRegionSave>('region')
