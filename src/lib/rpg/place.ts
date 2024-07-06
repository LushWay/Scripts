import { Settings } from 'lib'

export class Group {
  static groups = new Map<string, Group>()

  static pointCreator<T>(onCreate: (place: Place) => T) {
    return {
      group: (group: Group) => ({
        /**
         * Sets the point id
         *
         * @param id - Unique (in terms of group) id
         * @returns Other setter
         */
        id: (id: string) => {
          if (group.points.has(id)) {
            console.error(new Error(`Group(${group.id}).point(${id}) already exists`))
            while (group.points.has(id)) id += '_'
          }
          group.points.add(id)

          return {
            /**
             * Sets the point name
             *
             * @param name - Name of the point that will be displayed to the users
             * @returns - PointOfMatter
             */
            name: (name: string) => onCreate(new Place(group, id, name)),
          }
        },
      }),
    }
  }

  constructor(
    readonly id: string,
    readonly name?: string,
  ) {
    const existing = Group.groups.get(id)
    if (existing) return existing

    Group.groups.set(id, this)

    if (name) {
      // Define settings group name
      Settings.world(name, id, {})
    }
  }

  dimensionId: Dimensions = 'overworld'

  /**
   * Sets group dimension id
   *
   * @param dimension
   */
  setDimensionId(dimension: Dimensions) {
    this.dimensionId = dimension
    return this
  }

  private points = new Set<string>()

  /**
   * Creates new point of matter
   *
   * @returns
   */
  point(id: string) {
    return Group.pointCreator(place => place)
      .group(this)
      .id(id)
  }
}

export class Place {
  readonly fullId: string

  constructor(
    readonly group: Group,
    readonly id: string,
    readonly name: string,
  ) {
    this.fullId = group.id + ' ' + this.id
  }
}
