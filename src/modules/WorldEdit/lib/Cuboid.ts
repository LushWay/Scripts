/**
 * @typedef {Object} ChunkSize
 * @property {number} x - The max Length of a chunk
 * @property {number} y - The max Height of a chunk
 * @property {number} z - The max Width of a chunk
 */

export class Cuboid {
  max

  min

  pos1

  pos2

  xCenter

  xMax

  xMin

  xRadius

  yCenter

  yMax

  yMin

  yRadius

  zCenter

  zMax

  zMin

  zRadius

  /**
   * @param {Vector3} pos1
   * @param {Vector3} pos2
   */
  constructor(pos1, pos2) {
    this.pos1 = { x: pos1.x, y: pos1.y, z: pos1.z }
    this.pos2 = { x: pos2.x, y: pos2.y, z: pos2.z }

    this.xMin = Math.min(this.pos1.x, this.pos2.x)
    this.yMin = Math.min(this.pos1.y, this.pos2.y)
    this.zMin = Math.min(this.pos1.z, this.pos2.z)
    this.xMax = Math.max(this.pos1.x, this.pos2.x)
    this.yMax = Math.max(this.pos1.y, this.pos2.y)
    this.zMax = Math.max(this.pos1.z, this.pos2.z)

    this.min = {
      x: this.xMin,
      y: this.yMin,
      z: this.zMin,
    }

    this.max = {
      x: this.xMax,
      y: this.yMax,
      z: this.zMax,
    }

    this.xRadius = (this.xMax - this.xMin) / 2
    this.yRadius = (this.yMax - this.yMin) / 2
    this.zRadius = (this.zMax - this.zMin) / 2
    this.xCenter = (this.xMax + this.xMin) / 2
    this.yCenter = (this.yMax + this.yMin) / 2
    this.zCenter = (this.zMax + this.zMin) / 2
  }

  /**
   * Returns the amount of blocks in this cuboid
   *
   * @returns {number}
   */
  get size() {
    const x = this.xMax - this.xMin + 1
    const y = this.yMax - this.yMin + 1
    const z = this.zMax - this.zMin + 1
    return x * y * z
  }

  /**
   * Splits a cuboid into mulitple cuboid of a chunk size
   *
   * @param {Vector3} size
   * @returns {Cuboid[]}
   */
  split(size = { x: 1, y: 1, z: 1 }) {
    /** @type {Record<string, number[]>} */
    const breakpoints = {
      x: [],
      y: [],
      z: [],
    }
    /** @type {Cuboid[]} */
    const cubes = []

    for (const entry of Object.entries(size)) {
      /** @type {[keyof Vector3, number]} */

      const [axis, value] = entry

      for (let coordinate = this.min[axis]; ; coordinate = coordinate + value) {
        if (coordinate < this.max[axis]) {
          // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          breakpoints[axis].push(coordinate)
        } else {
          // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          breakpoints[axis].push(this.max[axis])
          break
        }
      }
    }

    breakpoints.x.forEach((x, xi) => {
      breakpoints.y.forEach((y, yi) => {
        breakpoints.z.forEach((z, zi) => {
          const current = {
            x: x,
            y: y,
            z: z,
          }

          const indexOf = {
            x: xi,
            y: yi,
            z: zi,
          }

          /** @type {Vector3} */

          const nextCord = {}

          for (const key in breakpoints) {
            /** @type {keyof Vector3} */

            const axis = key

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            const nextValue = breakpoints[axis][indexOf[axis] + 1]

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            if (!nextValue && breakpoints[axis].length > 1) return

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            nextCord[axis] = nextValue ?? current[axis]

            // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            if (nextCord[axis] !== this.max[axis]) nextCord[axis]--
          }

          cubes.push(new Cuboid(current, nextCord))
        })
      })
    })

    return cubes
  }
}
