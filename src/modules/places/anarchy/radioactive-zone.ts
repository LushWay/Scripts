import { EntityDamageCause, GameMode, system, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { Sounds } from 'lib/assets/custom-sounds'
import { sendPacketToStdout } from 'lib/bds/api'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/text'
import { Vec } from 'lib/vector'
import { Spawn } from '../spawn'

export class RadioactiveZone {
  constructor(
    readonly center: Vector3,
    readonly radius: number,
  ) {
    let i = 0
    system.runInterval(
      () => {
        const players = world.getAllPlayers()
        const rad = this.radius
        const center = this.center
        i++
        if (i >= 3) i = 0
        const soundTick = i === 0

        for (const player of players) {
          if (typeof player === 'undefined') {
            if (!reloadSent) sendPacketToStdout('reload', { reason: 'Player is undefined' })
            reloadSent = true
            return
          }

          if (
            player.database.inv !== 'anarchy' ||
            Spawn.region?.area.isIn(player) ||
            player.getGameMode() === GameMode.creative
          )
            continue

          const distance = Vec.distance(player.location, center)
          let played = false
          const sound = (volume: number, num = 1) => {
            if (!played && soundTick) {
              player.runCommand('stopsound @s ' + Sounds.Radiation)
              for (let i = 0; i < num; i++) player.playSound(Sounds.Radiation, { volume, pitch: i * 0.5 + 1 })
            }
            played = true
          }

          if (distance > rad - 20) {
            sound(0.5)
          }

          if (distance > rad) {
            sound(2, 2)
            player.onScreenDisplay.setActionBar(t.warn`Высокая радиация!`, ActionbarPriority.Highest)
            player.addEffect(MinecraftEffectTypes.Poison, 10 * TicksPerSecond, { showParticles: true, amplifier: 1 })
          }

          if (distance > rad + 20) {
            sound(4, 4)
            played = true
            player.onScreenDisplay.setActionBar(t.error`Очень высокая радиация!`, ActionbarPriority.Highest)
            player.applyDamage(2, { cause: EntityDamageCause.magic })
            if (!player.getEffects().find(e => e.typeId === MinecraftEffectTypes.Darkness))
              player.addEffect(MinecraftEffectTypes.Darkness, 10 * TicksPerSecond, {
                showParticles: true,
                amplifier: 255,
              })
          }

          if (!played) player.runCommand('stopsound @s ' + Sounds.Radiation)
        }
      },
      'radioactive zone',
      20,
    )
  }
}

let reloadSent = false
