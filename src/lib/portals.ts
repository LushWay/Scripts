import { CameraFadeOptions, Player } from '@minecraft/server'
import { LockAction, LockActionOptions, PlaceAction } from 'lib/action'
import { hexToRgb } from 'lib/util'
import { Vector } from 'lib/vector'
import { Core } from './extensions/core'

export class Portal {
  static canTeleport(player: Player, lockActionOptions?: Parameters<(typeof LockAction)['locked']>[1]) {
    return LockAction.locked(player, lockActionOptions)
  }

  static showHudTitle(player: Player, place?: string) {
    player.onScreenDisplay.setHudTitle(place ?? Core.name, {
      fadeInDuration: 0,
      stayDuration: 100,
      fadeOutDuration: 0,
      subtitle: '§2Перемещение...',
    })
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
    options: { lockAction?: LockActionOptions; fadeScreen?: boolean; title?: string } = {},
    updateHud?: VoidFunction,
  ) {
    if (!this.canTeleport(player, options.lockAction)) return

    if (options.fadeScreen) this.fadeScreen(player)
    player.teleport(to)

    updateHud?.()

    this.showHudTitle(player, options.title)
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
      for (const pos of Vector.foreach(this.from, this.to)) {
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
