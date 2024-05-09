import { Player, Vector } from '@minecraft/server'
import { LockAction, PlaceAction } from 'lib/Action'

// TODO Builder style

interface TeleportOptions {
  lockActionOptions?: Parameters<(typeof LockAction)['locked']>[1]
  place?: string
  fadeScreen?: boolean
}

export class Portal {
  command

  from

  place

  to

  static canTeleport(player: Player, { fadeScreen = true, lockActionOptions, place }: TeleportOptions = {}) {
    if (LockAction.locked(player, lockActionOptions)) return false
    if (fadeScreen) {
      const inS = 0.2
      const stayS = 2.0
      const outS = 2.0
      const red = 10 / 256
      const green = 20 / 256
      const blue = 10 / 256
      // #102010

      player.camera.fade({
        fadeTime: { fadeInTime: inS, holdTime: stayS, fadeOutTime: outS },
        fadeColor: { red, green, blue },
      })
    }

    return () => {
      player.onScreenDisplay.setHudTitle(place ?? Core.name, {
        fadeInDuration: 0,
        stayDuration: 100,
        fadeOutDuration: 0,
        subtitle: '§2Перемещение...',
      })
    }
  }

  static teleport(player: Player, to: Vector3, options: TeleportOptions = {}) {
    if (this.canTeleport(player, options)) player.teleport(to)
  }

  /**
   * Creates new portal.
   *
   * @param {string} name
   * @param {Vector3 | null} from
   * @param {Vector3 | null} to
   * @param {Vector3 | ((player: Player) => void)} place
   * @param {object} [o]
   * @param {string[]} [o.aliases]
   * @param {boolean} [o.createCommand]
   * @param {string} [o.commandDescription]
   * @param {boolean} [o.allowAnybody]
   */
  constructor(
    name: string,
    from: Vector3 | null,
    to: Vector3 | null,
    place: Vector3 | ((player: Player) => void),
    {
      aliases = [],
      createCommand = true,
      commandDescription,
      allowAnybody = false,
    }: { aliases?: string[]; createCommand?: boolean; commandDescription?: string; allowAnybody?: boolean } = {},
  ) {
    // console.debug('Portal init', name, { from: from ? Vector.string(from) : from, to: to ? Vector.string(to) : to })
    this.from = from
    this.to = to
    if (typeof place === 'function') {
      this.teleport = place
    } else this.place = place

    if (createCommand)
      this.command = new Command(name)
        .setAliases(...aliases)
        .setDescription(commandDescription ?? `§bТелепорт на ${name}`)
        .setGroup('public')
        .setPermissions(allowAnybody ? 'everybody' : undefined)
        .executes(ctx => {
          this.teleport(ctx.player)
        })

    if (from && to) {
      for (const pos of Vector.foreach(from, to)) {
        PlaceAction.onEnter(pos, p => this.teleport(p))
      }
    }
  }

  teleport(player: Player) {
    if (this.place) Portal.teleport(player, this.place)
  }
}
