import { Player, Vector, system, world } from '@minecraft/server'
import { request } from './BDS/api.js'

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
const inRange = (value, min, max) => value <= max && value >= min

export class Zone {
  /**
   *
   * @param {Player} player
   * @param {boolean} isX
   * @param {{x: number, z: number}} zone
   * @param {boolean} [plus]
   */
  returnToZone(player, isX, zone, plus) {
    const loc = isX
      ? [zone.x + (plus ? 1 : -1), player.location.y, player.location.z]
      : [player.location.x, player.location.y, zone.z + (plus ? 1 : -1)]

    player.teleport({ x: loc[1], y: loc[2], z: loc[3] })
    player.onScreenDisplay.setActionBar(`§cОграничение мира до: §f${isX ? zone.x : zone.z}${isX ? 'x' : 'z'}`)
  }
  /**
   *
   * @param {VectorXZ} center
   * @param {number | ((players: Player[]) => number)} radius
   */
  constructor(center, radius) {
    this.center = center
    this.radius = radius
    this.interval = system.runInterval(
      () => {
        const players = world.getAllPlayers()
        this.lastRadius = typeof this.radius === 'function' ? this.radius(players) : this.radius
        const rad = this.lastRadius
        const center = this.center

        for (const p of players) {
          const rmax = { x: center.x + rad, z: center.x + rad }
          const rmin = { x: center.z - rad, z: center.z - rad }
          if (!p) {
            if (!reloadSent) request('reload', { status: 300 })
            reloadSent = true
            return
          }
          const { x, z } = Vector.floor(p.location)

          const xtrue = inRange(x, rmin.x, rmax.x)
          const ztrue = inRange(z, rmin.z, rmax.z)

          if (x >= rmax.x && x <= rmax.x + 10 && ztrue) this.returnToZone(p, true, rmax)
          if (z >= rmax.z && z <= rmax.z + 10 && xtrue) this.returnToZone(p, false, rmax)
          if (x <= rmin.x && x >= rmin.x - 10 && ztrue) this.returnToZone(p, true, rmin, true)
          if (z <= rmin.z && z >= rmin.z - 10 && xtrue) this.returnToZone(p, false, rmin, true)
        }
      },
      'zone',
      0
    )
  }
}

let reloadSent = false
