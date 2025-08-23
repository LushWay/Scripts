export const VecSymbol = Symbol('vector')

export class VecXZ {
  /** Checks if vector c is between a and b */
  static isBetween(a: VectorXZ, b: VectorXZ, c: VectorXZ) {
    return (
      c.x >= (a.x < b.x ? a.x : b.x) &&
      c.x <= (a.x > b.x ? a.x : b.x) &&
      c.z >= (a.z < b.z ? a.z : b.z) &&
      c.z <= (a.z > b.z ? a.z : b.z)
    )
  }

  /**
   * Returns if 2d distance between center and a is less then radius. This is way faster then Vector.distance because it
   * only checks x and z, and also it doesn't use Math.hypot
   */
  static isInsideRadius(center: VectorXZ, a: VectorXZ, radius: number) {
    return (center.x - a.x) ** 2 + (center.z - a.z) ** 2 < radius ** 2
  }

  static center(a: VectorXZ, b: VectorXZ) {
    return {
      x: (b.x - a.x) / 2 + a.x,
      z: (b.z - a.z) / 2 + a.z,
    }
  }

  static equals = (a: VectorXZ, b: VectorXZ) => a.x === b.x && a.z === b.z

  /**
   * Returns two vectors around a
   *
   * Alias to
   *
   *       VecXZ.add(a, { x: x, z: z }), VecXZ.add(a, { x: -x, z: -z })]
   *
   * @param x Number to increase vector on x axis.
   * @param y Number to increase vector on y axis. Defaults to x
   * @param z Number to increase vector on z axis. Defaults to x
   */
  static around(a: VectorXZ, x: number, y = x, z = y): [VecXZ, VecXZ] {
    const difference = new VecXZ(x, z)
    return [VecXZ.subtract(a, difference), VecXZ.add(a, difference)]
  }

  /** Returns the subtraction of these vectors. */
  static subtract(a: VectorXZ, b: VectorXZ) {
    return new VecXZ(a.x - b.x, a.z - b.z)
  }

  /** Returns a vector that is made from the largest components of two vectors. */
  static max(a: VectorXZ, b: VectorXZ) {
    return new VecXZ(Math.max(a.x, b.x), Math.max(a.z, b.z))
  }

  /** Returns a vector that is made from the smallest components of two vectors. */
  static min(a: VectorXZ, b: VectorXZ) {
    return new VecXZ(Math.min(a.x, b.x), Math.min(a.z, b.z))
  }

  /** Returns the component-wise product of these vectors. */
  static multiply(a: VectorXZ, b: number) {
    return new VecXZ(a.x * b, a.z * b)
  }

  /** Returns the component-wise product of these vectors. */
  static multiplyVec(a: VectorXZ, b: VectorXZ) {
    return new VecXZ(a.x * b.x, a.z * b.z)
  }

  /** Returns the addition of these vectors. */
  static add(a: VectorXZ, b: VectorXZ): VecXZ {
    return new VecXZ(a.x + b.x, a.z + b.x)
  }

  static fromVectorXZ(vector: VectorXZ) {
    return new this(vector.x, vector.z)
  }

  /** Creates a new instance of an abstract vector. */
  constructor(
    /** X component of this vector. */
    public x: number,

    /** Z component of this vector. */
    public z: number,
  ) {}

  /** Returns the length of this vector. */
  length() {
    return Math.hypot(this.x, this.z)
  }

  /** Returns this vector as a normalized vector. */
  normalized() {
    const magnitude = this.length()
    if (magnitude === 0) return this

    const directionX = this.x / magnitude
    const directionZ = this.z / magnitude

    return new VecXZ(directionX, directionZ)
  }

  add(a: VectorXZ) {
    return VecXZ.add(this, a)
  }

  substract(a: VectorXZ) {
    return VecXZ.subtract(this, a)
  }

  multiply(a: number) {
    return VecXZ.multiply(this, a)
  }

  multiplyVec(a: VectorXZ) {
    return VecXZ.multiplyVec(this, a)
  }
}

export class Vec {
  static isVec(unit: unknown): unit is Vector3 {
    if (!unit || typeof unit !== 'object') return false
    if (unit instanceof Vec || VecSymbol in unit) return true

    const keys = Object.getOwnPropertyNames(unit)
    return keys.length === 3 && 'x' in unit && 'z' in unit && 'y' in unit
  }

  /**
   * Returns string representation of vector ('x y z')
   *
   * @param colorize Whenether to color vector args or not
   */
  static string = (a: Vector3, colorize?: boolean) =>
    !colorize ? `${a.x} ${a.y} ${a.z}` : `§c${a.x} §a${a.y} §b${a.z}`

  static parse = (string: string) => {
    const match = /(?:§c)?(-?\d+) (?:§a)?(-?\d+) (?:§b)?(-?\d+)/.exec(string)
    if (!match) return

    const [x, y, z] = match.slice(1).map(parseFloat) as [number, number, number]
    return new Vec(x, y, z)
  }

  /**
   * Returns whenether vector is valid or not
   *
   * Valid vector don't uses NaN values
   */
  static isValid = (a: Vector3) =>
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
  static around(a: Vector3, x: number, y = x, z = y): [Vec, Vec] {
    const difference = new Vec(x, y, z)
    return [Vec.subtract(a, difference), Vec.add(a, difference)]
  }

  /**
   * Returns a generator of Vector3 objects between two provided Vector3 objects
   *
   * @param a - Starting Vector3 point
   * @param b - Ending Vector3 point
   * @returns - Generator of Vector3 objects
   */
  static *forEach(a: Vector3, b: Vector3) {
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
    return new Vec(Math.floor(x.x), Math.floor(x.y), Math.floor(x.z))
  }

  /** Checks if vector c is between a and b */
  static isBetween(a: Vector3, b: Vector3, c: Vector3) {
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

  /** Returns the addition of these vectors. */
  static add(a: Vector3, b: Vector3): Vec {
    return new Vec(a.x + b.x, a.y + b.y, a.z + b.z)
  }

  /** Returns the cross product of these two vectors. */
  static cross(a: Vector3, b: Vector3) {
    return new Vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)
  }

  /** Returns the distance between two vectors. */
  static distance(a: Vector3, b: Vector3) {
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  }

  /**
   * Returns if 3d distance between center and a is less then radius. This is faster then using Vector.distance <=
   * radius because it doesn't use Math.hypot and instead uses radius ** 2
   */
  static isInsideRadius(center: Vector3, a: Vector3, radius: number) {
    return (center.x - a.x) ** 2 + (center.y - a.y) ** 2 + (center.z - a.z) ** 2 < radius ** 2
  }

  /** Returns the component-wise division of these vectors. */
  static divide(a: Vector3, b: number) {
    return new Vec(a.x / b, a.y / b, a.z / b)
  }

  /** Returns a vector that is made from the largest components of two vectors. */
  static max(a: Vector3, b: Vector3) {
    return new Vec(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z))
  }

  /** Returns a vector that is made from the smallest components of two vectors. */
  static min(a: Vector3, b: Vector3) {
    return new Vec(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z))
  }

  /** Returns the component-wise product of these vectors. */
  static multiplyVec(a: Vector3, b: Vector3) {
    return new Vec(a.x * b.x, a.y * b.y, a.z * b.z)
  }

  /** Returns the component-wise product of these vectors. */
  static multiply(a: Vector3, b: number) {
    return new Vec(a.x * b, a.y * b, a.z * b)
  }

  /** Returns the subtraction of these vectors. */
  static subtract(a: Vector3, b: Vector3) {
    return new Vec(a.x - b.x, a.y - b.y, a.z - b.z)
  }

  static center(a: Vector3, b: Vector3) {
    return new Vec((b.x - a.x) / 2 + a.x, (b.y - a.y) / 2 + a.y, (b.z - a.z) / 2 + a.z)
  }

  /** Checks if provided vector is on the edge of max and min */
  static isEdge(min: Vector3, max: Vector3, { x, y, z }: Vector3) {
    return (
      ((x == min.x || x == max.x) && (y == min.y || y == max.y)) ||
      ((y == min.y || y == max.y) && (z == min.z || z == max.z)) ||
      ((z == min.z || z == max.z) && (x == min.x || x == max.x))
    )
  }

  /** A constant vector that represents (0, 0, -1). */
  static readonly back = new Vec(0, 0, -1)

  /** A constant vector that represents (0, -1, 0). */
  static readonly down = new Vec(0, -1, 0)

  /** A constant vector that represents (0, 0, 1). */
  static readonly forward = new Vec(0, 0, 1)

  /** A constant vector that represents (-1, 0, 0). */
  static readonly left = new Vec(-1, 0, 0)

  /** A constant vector that represents (1, 1, 1). */
  static readonly one = new Vec(1, 1, 1)

  /** A constant vector that represents (1, 0, 0). */
  static readonly right = new Vec(1, 0, 0)

  /** A constant vector that represents (0, 1, 0). */
  static readonly up = new Vec(0, 1, 0)

  /** A constant vector that represents (0, 0, 0). */
  static readonly zero = new Vec(0, 0, 0)

  static fromVector3(vector: Vector3) {
    return new this(vector.x, vector.y, vector.z)
  }

  /** Creates a new instance of an abstract vector. */
  constructor(
    /** X component of this vector. */
    public x: number,
    /** Y component of this vector. */
    public y: number,
    /** Z component of this vector. */
    public z: number,
  ) {}

  /** Returns the length of this vector. */
  length() {
    return Math.hypot(this.x, this.y, this.z)
  }

  /**
   * Compares this vector and another vector to one another.
   *
   * @param other Other vector to compare this vector to.
   * @returns True if the two vectors are equal.
   */
  equals(other: Vector3) {
    if (this.x === other.x && this.y === other.y && this.z === other.z) return true
    else return false
  }

  /** Returns the squared length of this vector. */
  lengthSquared() {
    return this.x ** 2 + this.y ** 2 + this.z ** 2
  }

  /** Returns this vector as a normalized vector. */
  normalized() {
    const magnitude = this.length()
    if (magnitude === 0) return this

    const directionX = this.x / magnitude
    const directionY = this.y / magnitude
    const directionZ = this.z / magnitude

    return new Vec(directionX, directionY, directionZ)
  }

  add(a: Vector3) {
    return Vec.add(this, a)
  }

  substract(a: Vector3) {
    return Vec.subtract(this, a)
  }

  multiply(a: number) {
    return Vec.multiply(this, a)
  }

  multiplyVec(a: Vector3) {
    return Vec.multiplyVec(this, a)
  }

  floor() {
    return Vec.floor(this)
  }
}
