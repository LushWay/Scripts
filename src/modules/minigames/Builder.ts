import { Player } from '@minecraft/server'
import { LockAction, Sidebar } from 'lib'

// TODO Add minigame place

export class Minigame {
  static instances: Record<string, Minigame> = {}

  static getCurrent(player: Player) {
    return Object.values(this.instances).find(e => e.players.includes(player.id))
  }

  static getQuene(player: Player) {
    return Object.values(this.instances).find(e => e.quene.has(player.id))
  }

  players: string[] = []

  quene = new Set<string>()

  name

  sidebar

  spawn

  /**
   * Creates new Minigame manager.
   *
   * @param {string} name - Name of the minigame. Needs to stay unique.
   * @param {object} o - Options.
   * @param {Vector3} o.spawn - Minigame spawn
   * @param {Sidebar} o.sidebar
   */

  constructor(name: string, { spawn, sidebar }: { spawn: Vector3; sidebar: Sidebar }) {
    this.name = name
    this.spawn = spawn
    this.sidebar = sidebar

    Minigame.instances[name] = this
  }

  showHud(player: Player) {
    // TODO
  }
}

new LockAction(player => !!Minigame.getQuene(player), `Вы находитесь в очереди миниигры. Выйти: §f.quit`)
