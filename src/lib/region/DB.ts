import { table } from 'lib/database/abstract'

type CubeRegion = {
  t: 'c'
  key: string
  from: VectorXZ
  to: VectorXZ
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

type RadiusRegion = {
  t: 'r'
  st: string
  key: string
  radius: number
  center: Vector3
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export const REGION_DB = table<CubeRegion | RadiusRegion>('region')
