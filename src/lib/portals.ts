import { CameraFadeOptions, Player, TicksPerSecond } from '@minecraft/server'
import { LockAction, LockActionCheckOptions, PlaceAction } from 'lib/action'
import { hexToRgb } from 'lib/util'
import { Vec } from 'lib/vector'
import { Core } from './extensions/core'
import { i18n } from './i18n/text'

export class Portal {
  static canTeleport(player: Player, lockActionOptions?: Parameters<(typeof LockAction)['locked']>[1]) {
    return !LockAction.locked(player, lockActionOptions)
  }

  static showHudTitle(player: Player, place?: string, time = 5) {
    if (place !== '') {
      player.onScreenDisplay.setHudTitle(place ?? Core.name, {
        fadeInDuration: 0,
        stayDuration: time * TicksPerSecond,
        fadeOutDuration: 0,
        subtitle: i18n.nocolor`§2Перемещение...`.to(player.lang),
        priority: 100,
      })
    }
  }

  private static readonly fadeOptions: CameraFadeOptions = {
    fadeTime: { fadeInTime: 0.2, holdTime: 2, fadeOutTime: 2 },
    fadeColor: hexToRgb('#102010'),
  }

  static fadeScreen(player: Player) {
    player.camera.fade(this.fadeOptions)
  }

  static teleport(
    player: Player,
    to: Vector3,
    {
      fadeScreen = true,
      lockAction,
      title,
    }: { lockAction?: LockActionCheckOptions; fadeScreen?: boolean; title?: string } = {},
    updateHud?: VoidFunction,
  ) {
    if (!this.canTeleport(player, lockAction)) return

    if (fadeScreen) this.fadeScreen(player)
    player.teleport(to)

    updateHud?.()

    this.showHudTitle(player, title)
  }

  static portals = new Map<string, Portal>()

  /** Creates new portal. */
  constructor(
    readonly id: string,
    private from: Vector3 | null,
    private to: Vector3 | null,
    private place: Vector3 | PlayerCallback,
  ) {
    const previous = Portal.portals.get(this.id)
    if (previous) {
      previous.from = from
      previous.to = to
      previous.place = place
      previous.createPlaceAction()
      return previous
    } else {
      Portal.portals.set(this.id, this)
      this.createPlaceAction()
    }
  }

  private unsubscribers: VoidFunction[] = []

  private createPlaceAction() {
    for (const unsubscribe of this.unsubscribers) unsubscribe()
    this.unsubscribers = []

    if (this.from && this.to)
      for (const pos of Vec.forEach(this.from, this.to)) {
        this.unsubscribers.push(PlaceAction.onEnter(pos, p => this.teleport(p)).unsubscribe)
      }
  }

  createCommand() {
    return new Command(this.id).setGroup('public').executes(ctx => this.teleport(ctx.player))
  }

  teleport(player: Player) {
    if (typeof this.place === 'function') this.place(player)
    else Portal.teleport(player, this.place)
  }
}
