import { table } from 'lib/database/abstract'
import { RegionPermissions } from './Region'

interface CubeRegionSave {
  t: 'c'
  from: VectorXZ
  to: VectorXZ
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

interface RadiusRegionSave {
  t: 'r'
  st: string
  radius: number
  center: Vector3
  dimensionId: Dimensions
  permissions: Partial<RegionPermissions>
}

export const RegionDatabase = table<CubeRegionSave | RadiusRegionSave>('region', () => ({
  t: 'r',
  permissions: {},
  dimensionId: 'overworld',
  center: { x: 0, y: 0, z: 0 },
  st: 'radius',
  radius: 0,
}))
