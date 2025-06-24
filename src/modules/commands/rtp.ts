import { Player, TicksPerSecond } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { LockAction, Vec } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/i18n/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { randomLocationInAnarchy } from 'modules/places/anarchy/random-location-in-anarchy'

const rtpPlayers = new WeakPlayerMap<Vector3>()
new LockAction(player => rtpPlayers.has(player), t.error`Вы телепортируетесь!`)

function cancelRtp(player: Player) {
  const location = rtpPlayers.get(player)
  if (!location) return player.fail(t.error`Вы не телепортируетесь!`)

  rtpComplete(player, location)
}

function rtpComplete(player: Player, location: Vector3) {
  rtpPlayers.delete(player)
  player.teleport(location)
  player.removeEffect(MinecraftEffectTypes.SlowFalling)
}

export const rtpCommand = new Command('rtp')
  .setAliases('wild')
  .setDescription(t`Телепортация в случайное место на анархии`)
  .setPermissions('member')
  .executes(ctx => {
    if (ctx.player.dimension.type !== 'overworld' || ctx.player.database.inv !== 'anarchy')
      return ctx.error(t.error`Недоступно`)
    if (LockAction.locked(ctx.player)) return

    rtpPlayers.set(ctx.player, ctx.player.location)

    randomLocationInAnarchy({
      info: info => ctx.player.onScreenDisplay.setActionBar(info, ActionbarPriority.Highest),
      onBlock: block => {
        ctx.player.addEffect(MinecraftEffectTypes.SlowFalling, 200 * TicksPerSecond, { amplifier: 100 })
        ctx.player.teleport(block)
      },
    }).then(location => {
      if (!location) return cancelRtp(ctx.player)

      rtpComplete(ctx.player, Vec.add(location.topmost, Vec.up))
    })
  })
  .overload('cancel')
  .setDescription(t`Отменяет телепортацию`)
  .setPermissions('member')
  .executes(ctx => {
    cancelRtp(ctx.player)
  })
