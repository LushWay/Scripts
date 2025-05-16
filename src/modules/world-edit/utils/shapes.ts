import type { Cuboid } from '../../../lib/utils/cuboid'

export type ShapeFormula = (
  cuboid: Cuboid &
    Vector3 & {
      rad: number
    },
) => boolean

export const SHAPES = {
  'Сфера': ({ x, y, z, rad }) => x * x + y * y + z * z <= rad * rad,
  'Куб': () => true,

  'Квадратная пирамида': ({ x, y, z }) => Math.abs(x) + Math.abs(y) - z <= 0,
  'Конус': ({ x, y, z, zMin }) => Math.abs(Math.sqrt(x ^ (2 + y) ^ 2)) + Math.abs(z) - zMin === 0,
  'Пирамида': ({ x, y, z }) => y <= -(Math.abs(x) + Math.abs(z)),

  'cylindricalMountain': ({ x, y, z }) => y <= Math.sin(2 * Math.sqrt(x * x + z * z)),

  'ravine': ({ x, y, z }) => y >= -Math.sqrt(x * x + z * z),

  'customMountain': ({ x, y, z }) => y <= 0.5 * Math.sin(x / 10) + 0.5 * Math.cos(z / 10),

  'tetrahedron': ({ x, y, z, yMin, zMin }) => (
    Math.abs(-x) + Math.abs(x) + Math.abs(y) + Math.abs(z) - yMin, zMin === 0
  ),

  'triangle_prism': ({ x, y, z, yMin }) =>
    Math.abs(Math.abs(-x) / 2 + Math.abs(x) / 2 + Math.abs(y) - z) +
      Math.abs(Math.abs(-x) / 2 + Math.abs(x) / 2 + Math.abs(y) + z) -
      yMin ===
    0,

  't': ({ x, y, xRadius, yRadius }) => Math.abs(Math.abs(x / xRadius) + y / yRadius) + Math.abs(x / xRadius) <= 1,
  'tt': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.abs(Math.abs(Math.abs(x / xRadius) + y / yRadius) + Math.abs(x / xRadius) + z / zRadius) +
      Math.abs(Math.abs(x / xRadius) + y / yRadius) +
      Math.abs(x / xRadius) <=
    1,

  'outline': ({ x, y, z, xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter }) =>
    Math.abs(x + xCenter - xMin) <= 0 ||
    Math.abs(x + xCenter - xMax) <= 0 ||
    Math.abs(y + yCenter - yMin) <= 0 ||
    Math.abs(y + yCenter - yMax) <= 0 ||
    Math.abs(z + zCenter - zMin) <= 0 ||
    Math.abs(z + zCenter - zMax) <= 0,

  'Пустой куб': ({ x, y, z, xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter }) =>
    Math.abs(x + xCenter - xMin) > 0 &&
    Math.abs(x + xCenter - xMax) > 0 &&
    Math.abs(y + yCenter - yMin) > 0 &&
    Math.abs(y + yCenter - yMax) > 0 &&
    Math.abs(z + zCenter - zMin) > 0 &&
    Math.abs(z + zCenter - zMax) > 0,

  'border_line': ({ x, y, z, xMin, xMax, yMin, yMax, zMin, zMax, xCenter, yCenter, zCenter }) =>
    ((Math.abs(x + xCenter - xMin) <= 0 || Math.abs(x + xCenter - xMax) <= 0) &&
      (Math.abs(y + yCenter - yMin) <= 0 || Math.abs(y + yCenter - yMax) <= 0)) ||
    ((Math.abs(y + yCenter - yMin) <= 0 || Math.abs(y + yCenter - yMax) <= 0) &&
      (Math.abs(z + zCenter - zMin) <= 0 || Math.abs(z + zCenter - zMax) <= 0)) ||
    ((Math.abs(z + zCenter - zMin) <= 0 || Math.abs(z + zCenter - zMax) <= 0) &&
      (Math.abs(x + xCenter - xMin) <= 0 || Math.abs(x + xCenter - xMax) <= 0)),
  'wall_x': ({ x, y, z, yMin, yMax, zMin, zMax, yCenter, zCenter }) =>
    y + yCenter - yMin == 0 || y + yCenter - yMax == 0 || z + zCenter - zMin == 0 || z + zCenter - zMax == 0,
  'wall_y': ({ x, z, xMin, xMax, zMin, zMax, xCenter, zCenter }) =>
    x + xCenter - xMin == 0 || x + xCenter - xMax == 0 || z + zCenter - zMin == 0 || z + zCenter - zMax == 0,
  'wall_z': ({ x, y, xMin, xMax, yMin, yMax, xCenter, yCenter }) =>
    x + xCenter - xMin == 0 || x + xCenter - xMax == 0 || y + yCenter - yMin == 0 || y + yCenter - yMax == 0,
  'rounded_corner_1': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 5) + Math.pow(Math.abs(y / yRadius), 5) + Math.pow(Math.abs(z / zRadius), 5) <= 1,
  'rounded_corner_2': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 3) + Math.pow(Math.abs(y / yRadius), 3) + Math.pow(Math.abs(z / zRadius), 3) <= 1,
  'ellipse': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 2) + Math.pow(y / yRadius, 2) + Math.pow(z / zRadius, 2) <= 1,
  'octahedron': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 1) + Math.pow(Math.abs(y / yRadius), 1) + Math.pow(Math.abs(z / zRadius), 1) <= 1,
  'astroid_1': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.7) +
      Math.pow(Math.abs(y / yRadius), 0.7) +
      Math.pow(Math.abs(z / zRadius), 0.7) <=
    1,
  'astroid_1x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 0.7) + Math.pow(Math.abs(y / yRadius), 0.7) + Math.pow(Math.abs(z / zRadius), 0.7) <= 1,
  'astroid_1y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.7) + Math.pow(y / yRadius, 0.7) + Math.pow(Math.abs(z / zRadius), 0.7) <= 1,
  'astroid_1z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.7) + Math.pow(Math.abs(y / yRadius), 0.7) + Math.pow(z / zRadius, 0.7) <= 1,
  'astroid_2': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.5) +
      Math.pow(Math.abs(y / yRadius), 0.5) +
      Math.pow(Math.abs(z / zRadius), 0.5) <=
    1,
  'astroid_2x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 0.5) + Math.pow(Math.abs(y / yRadius), 0.5) + Math.pow(Math.abs(z / zRadius), 0.5) <= 1,
  'astroid_2y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.5) + Math.pow(y / yRadius, 0.5) + Math.pow(Math.abs(z / zRadius), 0.5) <= 1,
  'astroid_2z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.5) + Math.pow(Math.abs(y / yRadius), 0.5) + Math.pow(z / zRadius, 0.5) <= 1,
  'astroid_3': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.3) +
      Math.pow(Math.abs(y / yRadius), 0.3) +
      Math.pow(Math.abs(z / zRadius), 0.3) <=
    1,
  'astroid_3x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 0.3) + Math.pow(Math.abs(y / yRadius), 0.3) + Math.pow(Math.abs(z / zRadius), 0.3) <= 1,
  'astroid_3y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.3) + Math.pow(y / yRadius, 0.3) + Math.pow(Math.abs(z / zRadius), 0.3) <= 1,
  'astroid_3z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.abs(x / xRadius), 0.3) + Math.pow(Math.abs(y / yRadius), 0.3) + Math.pow(z / zRadius, 0.3) <= 1,
  'cylinder_x': ({ y, z, yRadius, zRadius }) =>
    Math.pow(y, 2) / (yRadius * yRadius) + Math.pow(z, 2) / (zRadius * zRadius) <= 1,
  'cylinder_y': ({ x, z, xRadius, zRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) + Math.pow(z, 2) / (zRadius * zRadius) <= 1,
  'cylinder_z': ({ x, y, xRadius, yRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) + Math.pow(y, 2) / (yRadius * yRadius) <= 1,
  'torus_x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(Math.min(yRadius, zRadius) / 1.35 - Math.sqrt(y * y + z * z), 2) + x * x <=
    Math.pow(Math.min(yRadius, xRadius) - Math.min(yRadius, zRadius) / 1.35, 2),
  'torus_y': ({ x, y, z, xRadius, zRadius }) =>
    Math.pow(Math.min(xRadius, zRadius) / 1.35 - Math.sqrt(x * x + z * z), 2) + y * y <=
    Math.pow(Math.min(xRadius, zRadius) - Math.min(xRadius, zRadius) / 1.35, 2),
  'torus_z': ({ x, y, z, xRadius, yRadius }) =>
    Math.pow(Math.min(xRadius, yRadius) / 1.35 - Math.sqrt(x * x + y * y), 2) + z * z <=
    Math.pow(Math.min(xRadius, yRadius) - Math.min(xRadius, yRadius) / 1.35, 2),
  'slope1': ({ x, y, z, xRadius, yRadius, zRadius }) => x / xRadius + y / yRadius + z / zRadius <= 0,
  'slope2': ({ x, y, z, xRadius, yRadius, zRadius }) => x / xRadius + y / yRadius - z / zRadius <= 0,
  'slope3': ({ x, y, z, xRadius, yRadius, zRadius }) => -x / xRadius + y / yRadius + z / zRadius <= 0,
  'slope4': ({ x, y, z, xRadius, yRadius, zRadius }) => -x / xRadius + y / yRadius - z / zRadius <= 0,
  'hour_glass_x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(y, 2) / (yRadius * yRadius) + Math.pow(z, 2) / (zRadius * zRadius) <= Math.pow(x, 2) / (xRadius * xRadius),
  'hour_glass_y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) + Math.pow(z, 2) / (zRadius * zRadius) <= Math.pow(y, 2) / (yRadius * yRadius),
  'hour_glass_z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) + Math.pow(y, 2) / (yRadius * yRadius) <= Math.pow(z, 2) / (zRadius * zRadius),
  'hour_glass_x_upper': ({ x, y, z, yRadius, zRadius }) =>
    Math.sqrt(yRadius * yRadius * (y * y) + zRadius * zRadius * (z * z)) <= x,
  'hour_glass_x_lower': ({ x, y, z, yRadius, zRadius }) =>
    Math.sqrt(yRadius * yRadius * (y * y) + zRadius * zRadius * (z * z)) <= -x,
  'hour_glass_y_upper': ({ x, y, z, xRadius, zRadius }) =>
    Math.sqrt(xRadius * xRadius * (x * x) + zRadius * zRadius * (z * z)) <= y,
  'hour_glass_y_lower': ({ x, y, z, xRadius, zRadius }) =>
    Math.sqrt(xRadius * xRadius * (x * x) + zRadius * zRadius * (z * z)) <= -y,
  'hour_glass_z_upper': ({ x, y, z, xRadius, yRadius }) =>
    Math.sqrt(xRadius * xRadius * (x * x) + yRadius * yRadius * (y * y)) <= z,
  'hour_glass_z_lower': ({ x, y, z, xRadius, yRadius }) =>
    Math.sqrt(xRadius * xRadius * (x * x) + yRadius * yRadius * (y * y)) <= -z,
  'hyperboloid_of_one_sheet_x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(y, 2) / (yRadius * yRadius) +
      Math.pow(z, 2) / (zRadius * zRadius) -
      Math.pow(x, 2) / (xRadius * xRadius) <=
    1,
  'hyperboloid_of_one_sheet_y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) +
      Math.pow(z, 2) / (zRadius * zRadius) -
      Math.pow(y, 2) / (yRadius * yRadius) <=
    1,
  'hyperboloid_of_one_sheet_z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x, 2) / (xRadius * xRadius) +
      Math.pow(y, 2) / (yRadius * yRadius) -
      Math.pow(z, 2) / (zRadius * zRadius) <=
    1,
  'elliptic_paraboloid_x': ({ x, y, z, yCenter, zCenter, xRadius, yRadius, zRadius }) =>
    Math.pow(y - yCenter, 2) / (yRadius * yRadius) + Math.pow(z - zCenter, 2) / (zRadius * zRadius) <= x / xRadius,
  'elliptic_paraboloid_x_inverted': ({ x, y, z, yCenter, zCenter, xRadius, yRadius, zRadius }) =>
    Math.pow(y - yCenter, 2) / (yRadius * yRadius) + Math.pow(z - zCenter, 2) / (zRadius * zRadius) <= x / -xRadius,
  'elliptic_paraboloid_y': ({ x, y, z, xCenter, zCenter, xRadius, yRadius, zRadius }) =>
    Math.pow(x - xCenter, 2) / (xRadius * xRadius) + Math.pow(z - zCenter, 2) / (zRadius * zRadius) <= y / yRadius,
  'elliptic_paraboloid_y_inverted': ({ x, y, z, xCenter, zCenter, xRadius, yRadius, zRadius }) =>
    Math.pow(x - xCenter, 2) / (xRadius * xRadius) + Math.pow(z - zCenter, 2) / (zRadius * zRadius) <= y / -yRadius,
  'elliptic_paraboloid_z': ({ x, y, z, xCenter, yCenter, xRadius, yRadius }) =>
    Math.pow(x - xCenter, 2) / (xRadius * xRadius) + Math.pow(y - yCenter, 2) / (yRadius * yRadius) <= z / yRadius,
  'elliptic_paraboloid_z_inverted': ({ x, y, z, xCenter, yCenter, xRadius, yRadius }) =>
    Math.pow(x - xCenter, 2) / (xRadius * xRadius) + Math.pow(y - yCenter, 2) / (yRadius * yRadius) <= z / -yRadius,
  'hyperbolic_paraboloid_x': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(y / yRadius, 2) - Math.pow(z / zRadius, 2) <= x / xRadius,
  'hyperbolic_paraboloid_y': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 2) - Math.pow(z / zRadius, 2) <= y / yRadius,
  'hyperbolic_paraboloid_z': ({ x, y, z, xRadius, yRadius, zRadius }) =>
    Math.pow(x / xRadius, 2) - Math.pow(y / yRadius, 2) <= z / zRadius,
} satisfies Record<string, ShapeFormula>
