import { Vector } from '@minecraft/server'

/** @type {Omit<typeof Vector, keyof Function | 'back' | 'down' | 'forward' | 'left' | 'up' | 'one' | 'right' | 'zero'>} */
const Static = {
  string: (a, color) => (!color ? `${a.x} ${a.y} ${a.z}` : `§c${a.x} §a${a.y} §b${a.z}`),
  valid: a => !(isNaN(a.x) || isNaN(a.y) || isNaN(a.z)),
  dot: (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
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
  floor(loc) {
    return { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) }
  },
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
    /**
     * @typedef {[number, number, number]} Vector3Array
     */
    /**
     * @param {Vector3Array} a
     * @param {Vector3Array} b
     * @returns {number}
     */
    function MathDot(a, b) {
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

/**
 * @type {PartialParts<Vector>}
 */
const Prototype = {
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
