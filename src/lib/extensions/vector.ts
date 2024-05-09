import { Vector } from '@minecraft/server'

// TODO Move to lib/vector when migrating to 1.20.60

declare module '@minecraft/server' {
  namespace Vector {
    /** Returns size between two vectors */
    function size(a: Vector3, b: Vector3): number

    /** Floors each vector axis using Math.floor */
    function floor(a: Vector3): Vector3
    /**
     * Generates a generator of Vector3 objects between two provided Vector3 objects
     *
     * @param a - Starting Vector3 point
     * @param b - Ending Vector3 point
     * @returns - Generator of Vector3 objects
     */
    function foreach(a: Vector3, b: Vector3): Generator<Vector3, void, unknown>

    /** Checks if vector c is between a and b */
    function between(a: Vector3, b: Vector3, c: Vector3): boolean

    /**
     * Returns string representation of vector ('x y z')
     *
     * @param color Whenether to color vector args or not
     */
    function string(a: Vector3, color?: boolean): string

    /** Returns dot product of two vectors */
    function dot(a: Vector3, b: Vector3): number

    /** Returns whenether vector is valid or not Valid vector don't uses NaN values */
    function valid(a: Vector3): boolean

    /**
     * Alias to
     *
     * ```js
     * ;[Vector.add(a, { x: x, y: y, z: z }), Vector.add(a, { x: -x, y: -y, z: -z })]
     * ```
     *
     * @param x Number to increase vector on x axis.
     * @param y Number to increase vector on y axis. Defaults to x
     * @param z Number to increase vector on z axis. Defaults to x
     */
    function around(a: Vector3, x: number, y?: number, z?: number): [Vector3, Vector3]
  }
}

const Static: Omit<
  typeof Vector,
  // eslint-disable-next-line @typescript-eslint/ban-types
  keyof Function | 'back' | 'down' | 'forward' | 'left' | 'up' | 'one' | 'right' | 'zero'
> = {
  /**
   * Returns string representation of vector ('x y z')
   *
   * @param color Whenether to color vector args or not
   */
  string: (a, color) => (!color ? `${a.x} ${a.y} ${a.z}` : `§c${a.x} §a${a.y} §b${a.z}`),

  /**
   * Returns whenether vector is valid or not
   *
   * Valid vector don't uses NaN values
   */
  valid: a => !(isNaN(a.x) || isNaN(a.y) || isNaN(a.z)),

  /** Returns dot product of two vectors */
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,

  /**
   * Returns two dots around vector
   *
   * Alias to
   *
   *       Vector.add(a, { x: x, y: y, z: z }), Vector.add(a, { x: -x, y: -y, z: -z })]
   *
   * @param x Number to increase vector on x axis.
   * @param y Number to increase vector on y axis. Defaults to x
   * @param z Number to increase vector on z axis. Defaults to x
   */
  around(a, x, y = x, z = y) {
    return [Vector.add(a, { x: x, y: y, z: z }), Vector.add(a, { x: -x, y: -y, z: -z })]
  },

  /**
   * Returns a generator of Vector3 objects between two provided Vector3 objects
   *
   * @param a - Starting Vector3 point
   * @param b - Ending Vector3 point
   * @returns - Generator of Vector3 objects
   */
  *foreach(a, b) {
    const [xmin, xmax] = a.x < b.x ? [a.x, b.x] : [b.x, a.x]
    const [ymin, ymax] = a.y < b.y ? [a.y, b.y] : [b.y, a.y]
    const [zmin, zmax] = a.z < b.z ? [a.z, b.z] : [b.z, a.z]
    for (let x = xmin; x <= xmax; x++) {
      for (let y = ymin; y <= ymax; y++) {
        for (let z = zmin; z <= zmax; z++) {
          yield { x, y, z }
        }
      }
    }
  },

  size(a, b) {
    // Each "max vector axis" - "min vector axis" + 1 * other axises
    return (
      ((b.x > a.x ? b.x - a.x : a.x - b.x) + 1) *
      ((b.y > a.y ? b.y - a.y : a.y - b.y) + 1) *
      ((b.z > a.z ? b.z - a.z : a.z - b.z) + 1)
    )
  },

  /** Floors each vector axis using Math.floor */
  floor(loc) {
    return { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) }
  },

  /** Checks if vector c is between a and b */
  between(a, b, c) {
    return (
      c.x >= (a.x < b.x ? a.x : b.x) &&
      c.x <= (a.x > b.x ? a.x : b.x) &&
      c.y >= (a.y < b.y ? a.y : b.y) &&
      c.y <= (a.y > b.y ? a.y : b.y) &&
      c.z >= (a.z < b.z ? a.z : b.z) &&
      c.z <= (a.z > b.z ? a.z : b.z)
    )
  },

  // Polyfill, a lot faster then native (0.11ms vs 0.54ms) avg
  // Author: Jayly <https://github.com/JaylyDev>
  // Project: https://github.com/JaylyDev/ScriptAPI

  add(a, b) {
    const vector = new Vector(a.x, a.y, a.z)
    vector.x += b.x
    vector.y += b.y
    vector.z += b.z
    return vector
  },

  cross(a, b) {
    return new Vector(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
  },

  distance(a, b) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    const distance = Math.hypot(dx, dy, dz)

    return distance
  },

  divide(a, b) {
    const vector = new Vector(a.x, a.y, a.z)

    if (typeof b === 'number') {
      vector.x /= b
      vector.y /= b
      vector.z /= b
    } else {
      vector.x /= b.x
      vector.y /= b.y
      vector.z /= b.z
    }

    return vector
  },

  lerp(a, b, t) {
    const dest = new Vector(a.x, a.y, a.z)
    dest.x += (b.x - a.x) * t
    dest.y += (b.y - a.y) * t
    dest.z += (b.z - a.z) * t
    return dest
  },

  max(a, b) {
    const vectors = [a, b]
    const arr = vectors.map(({ x, y, z }) => new Vector(x, y, z).length())
    const max = Math.max(...arr)
    const index = arr.indexOf(max)
    const vector3 = vectors[index]

    return new Vector(vector3.x, vector3.y, vector3.z)
  },

  min(a, b) {
    const vectors = [a, b]
    const arr = vectors.map(({ x, y, z }) => new Vector(x, y, z).length())
    const min = Math.min(...arr)
    const index = arr.indexOf(min)
    const vector3 = vectors[index]

    return new Vector(vector3.x, vector3.y, vector3.z)
  },

  multiply(a, b) {
    const vector = new Vector(a.x, a.y, a.z)

    if (typeof b === 'number') {
      vector.x *= b
      vector.y *= b
      vector.z *= b
    } else {
      vector.x *= b.x
      vector.y *= b.y
      vector.z *= b.z
    }

    return vector
  },

  slerp(a, b, s) {
    type Vector3Array = [number, number, number]
    function MathDot(a: Vector3Array, b: Vector3Array): number {
      return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
    }

    const θ = Math.acos(MathDot([a.x, a.y, a.z], [b.x, b.y, b.z]))
    const factor1 = Math.sin(θ * (1 - s)) / Math.sin(θ)
    const factor2 = Math.sin(θ * s) / Math.sin(θ)

    return new Vector(a.x * factor1 + b.x * factor2, a.y * factor1 + b.y * factor2, a.z * factor1 + b.z * factor2)
  },

  subtract(a, b) {
    const vector = new Vector(a.x, a.y, a.z)
    vector.x -= b.x
    vector.y -= b.y
    vector.z -= b.z
    return vector
  },
}

const Prototype: PartialParts<Vector> = {
  length() {
    return Math.hypot(this.x, this.y, this.z)
  },

  equals(other) {
    if (this.x === other.x && this.y === other.y && this.z === other.z) return true
    else return false
  },

  lengthSquared() {
    return this.x ** 2 + this.y ** 2 + this.z ** 2
  },

  normalized() {
    const magnitude = this.length()
    if (magnitude === 0) return this

    const DirectionX = this.x / magnitude

    const DirectionY = this.y / magnitude

    const DirectionZ = this.z / magnitude
    return new Vector(DirectionX, DirectionY, DirectionZ)
  },
}

for (const key of Object.keys(Static)) {
  Reflect.set(Vector, key, Static[key])
}
for (const key of Object.keys(Prototype)) {
  Reflect.set(Vector.prototype, key, Prototype[key])
}
