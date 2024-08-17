export class Vector {
  /**
   * Returns string representation of vector ('x y z')
   *
   * @param colorize Whenether to color vector args or not
   */
  static string = (a: Vector3, colorize?: boolean) =>
    !colorize ? `${a.x} ${a.y} ${a.z}` : `§c${a.x} §a${a.y} §b${a.z}`

  /**
   * Returns whenether vector is valid or not
   *
   * Valid vector don't uses NaN values
   */
  static valid = (a: Vector3) =>
    !isNaN(a.x) &&
    !isNaN(a.y) &&
    !isNaN(a.z) &&
    typeof a.x === 'number' &&
    typeof a.y === 'number' &&
    typeof a.z === 'number'

  /** Returns dot product of two vectors */
  static dot = (a: Vector3, b: Vector3) => a.x * b.x + a.y * b.y + a.z * b.z

  static equals = (a: Vector3, b: Vector3) => a.x === b.x && a.y === b.y && a.z === b.z

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
  static around(a: Vector3, x: number, y = x, z = y): [Vector, Vector] {
    return [Vector.add(a, { x: x, y: y, z: z }), Vector.add(a, { x: -x, y: -y, z: -z })]
  }

  /**
   * Returns a generator of Vector3 objects between two provided Vector3 objects
   *
   * @param a - Starting Vector3 point
   * @param b - Ending Vector3 point
   * @returns - Generator of Vector3 objects
   */
  static *foreach(a: Vector3, b: Vector3) {
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
  }

  /**
   * @param a
   * @param b
   * @returns
   */
  static size(a: Vector3, b: Vector3) {
    // Each "max vector axis" - "min vector axis" + 1 * other axises
    return (
      ((b.x > a.x ? b.x - a.x : a.x - b.x) + 1) *
      ((b.y > a.y ? b.y - a.y : a.y - b.y) + 1) *
      ((b.z > a.z ? b.z - a.z : a.z - b.z) + 1)
    )
  }

  /** Floors each vector axis using Math.floor */
  static floor(x: Vector3) {
    return { x: Math.floor(x.x), y: Math.floor(x.y), z: Math.floor(x.z) }
  }

  /** Checks if vector c is between a and b */
  static between(a: Vector3, b: Vector3, c: Vector3) {
    return (
      c.x >= (a.x < b.x ? a.x : b.x) &&
      c.x <= (a.x > b.x ? a.x : b.x) &&
      c.y >= (a.y < b.y ? a.y : b.y) &&
      c.y <= (a.y > b.y ? a.y : b.y) &&
      c.z >= (a.z < b.z ? a.z : b.z) &&
      c.z <= (a.z > b.z ? a.z : b.z)
    )
  }

  // Polyfill, a lot faster then native (0.11ms vs 0.54ms) avg
  // Author: Jayly <https://github.com/JaylyDev>
  // Project: https://github.com/JaylyDev/ScriptAPI

  /**
   * @remarks
   *   Returns the addition of these vectors.
   */
  static add(a: Vector3, b: Vector3): Vector {
    const vector = new Vector(a.x, a.y, a.z)
    vector.x += b.x
    vector.y += b.y
    vector.z += b.z
    return vector
  }

  /**
   * @remarks
   *   Returns the cross product of these two vectors.
   */
  static cross(a: Vector3, b: Vector3) {
    return new Vector(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
  }

  /**
   * @remarks
   *   Returns the distance between two vectors.
   */
  static distance(a: Vector3, b: Vector3) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    const distance = Math.hypot(dx, dy, dz)

    return distance
  }

  /**
   * @remarks
   *   Returns the component-wise division of these vectors.
   * @throws This function can throw errors.
   */
  static divide(a: Vector3, b: number | Vector3) {
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
  }

  /**
   * @remarks
   *   Returns the linear interpolation between a and b using t as the control.
   */
  static lerp(a: Vector3, b: Vector3, t: number) {
    const dest = new Vector(a.x, a.y, a.z)
    dest.x += (b.x - a.x) * t
    dest.y += (b.y - a.y) * t
    dest.z += (b.z - a.z) * t
    return dest
  }

  /**
   * @remarks
   *   Returns a vector that is made from the largest components of two vectors.
   */
  static max(a: Vector3, b: Vector3) {
    return { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) }
  }

  /**
   * @remarks
   *   Returns a vector that is made from the smallest components of two vectors.
   */
  static min(a: Vector3, b: Vector3) {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) }
  }

  /**
   * @remarks
   *   Returns the component-wise product of these vectors.
   */
  static multiply(a: Vector3, b: number | Vector3) {
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
  }

  /**
   * @remarks
   *   Returns the spherical linear interpolation between a and b using s as the control.
   */
  static slerp(a: Vector3, b: Vector3, s: number) {
    type Vector3Array = [number, number, number]
    function MathDot(a: Vector3Array, b: Vector3Array): number {
      return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
    }

    const θ = Math.acos(MathDot([a.x, a.y, a.z], [b.x, b.y, b.z]))
    const factor1 = Math.sin(θ * (1 - s)) / Math.sin(θ)
    const factor2 = Math.sin(θ * s) / Math.sin(θ)

    return new Vector(a.x * factor1 + b.x * factor2, a.y * factor1 + b.y * factor2, a.z * factor1 + b.z * factor2)
  }

  /**
   * @remarks
   *   Returns the subtraction of these vectors.
   */
  static subtract(a: Vector3, b: Vector3) {
    const vector = new Vector(a.x, a.y, a.z)
    vector.x -= b.x
    vector.y -= b.y
    vector.z -= b.z
    return vector
  }

  /** Checks if provided vector is on the edge of max and min */
  static isedge(min: Vector3, max: Vector3, { x, y, z }: Vector3) {
    return (
      ((x == min.x || x == max.x) && (y == min.y || y == max.y)) ||
      ((y == min.y || y == max.y) && (z == min.z || z == max.z)) ||
      ((z == min.z || z == max.z) && (x == min.x || x == max.x))
    )
  }

  /**
   * @remarks
   *   A constant vector that represents (0, 0, -1).
   */
  static readonly back = new Vector(0, 0, -1)

  /**
   * @remarks
   *   A constant vector that represents (0, -1, 0).
   */
  static readonly down = new Vector(0, -1, 0)

  /**
   * @remarks
   *   A constant vector that represents (0, 0, 1).
   */
  static readonly forward = new Vector(0, 0, 1)

  /**
   * @remarks
   *   A constant vector that represents (-1, 0, 0).
   */
  static readonly left = new Vector(-1, 0, 0)

  /**
   * @remarks
   *   A constant vector that represents (1, 1, 1).
   */
  static readonly one = new Vector(1, 1, 1)

  /**
   * @remarks
   *   A constant vector that represents (1, 0, 0).
   */
  static readonly right = new Vector(1, 0, 0)

  /**
   * @remarks
   *   A constant vector that represents (0, 1, 0).
   */
  static readonly up = new Vector(0, 1, 0)

  /**
   * @remarks
   *   A constant vector that represents (0, 0, 0).
   */
  static readonly zero = new Vector(0, 0, 0)

  /**
   * @remarks
   *   Creates a new instance of an abstract vector.
   * @param x X component of the vector.
   * @param y Y component of the vector.
   * @param z Z component of the vector.
   */
  constructor(
    /**
     * @remarks
     *   X component of this vector.
     */
    public x: number,
    /**
     * @remarks
     *   Y component of this vector.
     */
    public y: number,
    /**
     * @remarks
     *   Z component of this vector.
     */
    public z: number,
  ) {}

  /**
   * @remarks
   *   Returns the length of this vector.
   */
  length() {
    return Math.hypot(this.x, this.y, this.z)
  }

  /**
   * @remarks
   *   Compares this vector and another vector to one another.
   * @param other Other vector to compare this vector to.
   * @returns True if the two vectors are equal.
   */
  equals(other: Vector3) {
    if (this.x === other.x && this.y === other.y && this.z === other.z) return true
    else return false
  }

  /**
   * @remarks
   *   Returns the squared length of this vector.
   */
  lengthSquared() {
    return this.x ** 2 + this.y ** 2 + this.z ** 2
  }

  /**
   * @remarks
   *   Returns this vector as a normalized vector.
   */
  normalized() {
    const magnitude = this.length()
    if (magnitude === 0) return this

    const DirectionX = this.x / magnitude

    const DirectionY = this.y / magnitude

    const DirectionZ = this.z / magnitude
    return new Vector(DirectionX, DirectionY, DirectionZ)
  }
}
