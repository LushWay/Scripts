import { i18nShared } from 'lib/i18n/text'
import { Settings } from 'lib/settings'

export class Group {
  static groups = new Map<string, Group>()

  static readonly defaultName = i18nShared`Внешнее пространство`

  static placeCreator<T>(onCreate: (place: Place) => T) {
    return {
      group: (group: Group) => ({
        /**
         * Sets the point id
         *
         * @param id - Unique (in terms of group) id
         * @returns Other setter
         */
        id: (id: string) => {
          if (group.places.has(id)) {
            console.error(new Error(`Group(${group.id}).place(${id}) already exists`))
            while (group.places.has(id)) id += '_'
          }
          group.places.add(id)

          return {
            /**
             * Sets the point name
             *
             * @param name - Name of the point that will be displayed to the users
             * @returns - PointOfMatter
             */
            name: (name: SharedText) => onCreate(new Place(group, id, name)),
          }
        },
      }),
    }
  }

  constructor(
    readonly id: string,
    readonly name?: SharedText,
  ) {
    const existing = Group.groups.get(id)
    if (existing) return existing

    Group.groups.set(id, this)

    if (name) {
      // Define settings group name
      Settings.world(name, id, {})
    }
  }

  dimensionType: DimensionType = 'overworld'

  /**
   * Sets group dimension id
   *
   * @param dimension
   */
  setDimensionType(dimension: DimensionType) {
    this.dimensionType = dimension
    return this
  }

  private places = new Set<string>()

  /**
   * Creates new point of matter
   *
   * @returns
   */
  place(id: string) {
    return Group.placeCreator(place => place)
      .group(this)
      .id(id)
  }
}

export class Place {
  static readonly defaultName = i18nShared`Пусто`

  /** Example: StoneQuarry foodOvener */
  readonly id: string

  constructor(
    readonly group: Group,
    /** Example: 'foodOvener' */
    readonly shortId: string,
    /** Example: 'куда-то тепает' for location, 'Печкин' for npc */
    readonly name: SharedText,
  ) {
    // Trim start needed for empty point
    this.id = `${group.id} ${this.shortId}`.trimStart()
  }
}

// Empty group. Used to create places not linked with any groups/cities/villages
export const noGroup = new Group('')
