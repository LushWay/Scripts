import { Player, Vector } from '@minecraft/server'
import { EventLoaderWithArg } from './event-signal'
import { Settings } from './settings'
import { util } from './util'
// TODO Location edit form from command -locations
// TODO location grouping

type LocationTypeSuperset = 'vector3' | 'vector3+rotation' | 'vector3+radius'

export type Location<LocationType extends LocationTypeSuperset> = LocationType extends 'vector3'
  ? Vector3
  : LocationType extends 'vector3+rotation'
    ? Vector3 & { xRot: number; yRot: number }
    : Vector3 & { radius: number }

export class EditableLocation<LocationType extends LocationTypeSuperset = 'vector3'> {
  get safe(): ({ valid: false } | ({ valid: true } & Location<LocationType>)) & {
    onLoad: EditableLocation<LocationType>['onLoad']
    teleport: EditableLocation<LocationType>['teleport']
    id: string
  } {
    return this
  }

  static key = 'locations'

  static load(instance: EditableLocation<any>, location: Location<any>) {
    instance.x = location.x
    instance.y = location.y
    instance.z = location.z
    if ('xRot' in location) {
      instance.xRot = location.xRot
      instance.yRot = location.yRot
    }
    if ('radius' in location) {
      instance.radius = location.radius
    }
    EventLoaderWithArg.load(instance.onLoad, Object.assign(instance, { firstLoad: !instance.valid }))
  }

  get valid() {
    return this.onLoad.loaded
  }

  format

  type: LocationType

  onLoad = new EventLoaderWithArg<{ firstLoad: boolean } & Location<LocationType>, void>(
    Object.assign(this, { firstLoad: true }) as unknown as { firstLoad: boolean } & Location<LocationType>,
  )

  x = 0

  y = 0

  z = 0

  xRot = 0

  yRot = 0

  radius = 0

  private fallback: false | Location<LocationType> = false

  constructor(
    public id: string,
    { fallback = false, type }: { type?: LocationType; fallback?: EditableLocation<LocationType>['fallback'] } = {},
  ) {
    // @ts-expect-error AAaa
    this.type = type ?? 'vector3'
    this.fallback = fallback
    this.format = `x y z${
      this.type === 'vector3+rotation' ? ' xRot yRot' : this.type === 'vector3+radius' ? ' radius' : ''
    }`

    Settings.worldMap[EditableLocation.key][id] = {
      description: this.format,
      name: id,
      value: fallback ? Vector.string(fallback) : '',
      onChange: () => this.load(),
    }

    this.load()
  }

  private load() {
    const raw = Settings.worldDatabase[EditableLocation.key][this.id]

    if (typeof raw !== 'string' || raw === '') {
      if (this.fallback === false) {
        // Currently disabled warning
        // console.warn(
        //   '§eEmpty location §f' + this.id + '\n§r' + util.error.stack.get(1)
        // )
        return
      } else {
        return EditableLocation.load(this, this.fallback)
      }
    }

    const location = raw.trim().split(' ').map(Number)

    if (location.length !== this.format.trim().split(' ').length) {
      return console.error(
        new TypeError(`Invalid location, expected '${this.format}' but recieved '${util.stringify(raw)}'`),
      )
    }

    const [x, y, z, loc3, loc4] = location
    EditableLocation.load(
      this,
      this.type === 'vector3'
        ? { x, y, z }
        : this.type === 'vector3+rotation'
          ? { x, y, z, yRot: loc4, xRot: loc3 }
          : { x, y, z, radius: loc3 },
    )
  }

  teleport(player: Player) {
    player.teleport(
      Vector.add(this, { x: 0.5, y: 0, z: 0.5 }),
      this.type === 'vector3+rotation' ? { rotation: { x: this.xRot, y: this.yRot } } : void 0,
    )
  }
}

Settings.worldMap[EditableLocation.key] = {}
