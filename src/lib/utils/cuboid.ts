// @author - Smell Of Curry
export class Cuboid {
  max: Vector3

  min: Vector3

  pos1: Vector3

  pos2: Vector3

  xCenter: number

  xMax: number

  xMin: number

  xRadius: number

  yCenter: number

  yMax: number

  yMin: number

  yRadius: number

  zCenter: number

  zMax: number

  zMin: number

  zRadius: number

  constructor(pos1: Vector3, pos2: Vector3) {
    // This is done to ensure that the passed values are copied
    // For example if passed values are DatabaseValue it will
    // decrease performance drastically when accessing any of
    // its axises
    this.pos1 = { x: pos1.x, y: pos1.y, z: pos1.z }
    this.pos2 = { x: pos2.x, y: pos2.y, z: pos2.z }

    // We could make it into methods, but QuickJS works
    // the way that making it into one big function
    // is more optimal
    this.xMin = Math.min(this.pos1.x, this.pos2.x)
    this.yMin = Math.min(this.pos1.y, this.pos2.y)
    this.zMin = Math.min(this.pos1.z, this.pos2.z)
    this.xMax = Math.max(this.pos1.x, this.pos2.x)
    this.yMax = Math.max(this.pos1.y, this.pos2.y)
    this.zMax = Math.max(this.pos1.z, this.pos2.z)

    this.min = { x: this.xMin, y: this.yMin, z: this.zMin }

    this.max = { x: this.xMax, y: this.yMax, z: this.zMax }

    this.xRadius = (this.xMax - this.xMin) / 2
    this.yRadius = (this.yMax - this.yMin) / 2
    this.zRadius = (this.zMax - this.zMin) / 2
    this.xCenter = (this.xMax + this.xMin) / 2
    this.yCenter = (this.yMax + this.yMin) / 2
    this.zCenter = (this.zMax + this.zMin) / 2
  }

  /** Returns the amount of blocks in this cuboid */
  get size(): number {
    const x = this.xMax - this.xMin + 1
    const y = this.yMax - this.yMin + 1
    const z = this.zMax - this.zMin + 1
    return x * y * z
  }

  /** Splits a cuboid into mulitple cuboid of a chunk size */
  split(size: Vector3): Cuboid[] {
    const breakpoints: Record<string, number[]> = { x: [], y: [], z: [] }

    const cubes: Cuboid[] = []
    for (const entry of Object.entries(size)) {
      const [axis, value] = entry as [keyof Vector3, number]

      for (let coordinate = this.min[axis]; ; coordinate = coordinate + value) {
        if (coordinate < this.max[axis]) breakpoints[axis]?.push(coordinate)
        else {
          breakpoints[axis]?.push(this.max[axis])
          break
        }
      }
    }

    breakpoints.x?.forEach((x, xi) => {
      breakpoints.y?.forEach((y, yi) => {
        breakpoints.z?.forEach((z, zi) => {
          const current = { x: x, y: y, z: z }
          const indexOf = { x: xi, y: yi, z: zi }

          const nextCord: Vector3 = {} as Vector3
          for (const key in breakpoints) {
            const axis = key as keyof Vector3
            const nextValue = breakpoints[axis]?.[indexOf[axis] + 1]
            if (!nextValue && (breakpoints[axis]?.length ?? 2) > 1) return

            nextCord[axis] = nextValue ?? current[axis]
            if (nextCord[axis] !== this.max[axis]) nextCord[axis]--
          }

          cubes.push(new Cuboid(current, nextCord))
        })
      })
    })

    return cubes
  }
}
