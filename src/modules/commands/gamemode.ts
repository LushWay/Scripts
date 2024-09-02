import { GameMode, Player, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { is, isNotPlaying, LockAction, Temporary, Vector } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t, textTable } from 'lib/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { randomLocationInAnarchy } from 'modules/places/anarchy/random-location-in-anarchy'

function fastGamemode(mode: GameMode, shorname: string) {
  new Command(shorname)
    .setDescription('Переключает режим на ' + mode)
    .setPermissions('builder')
    .executes(ctx => {
      ctx.player.setGameMode(mode)
      ctx.player.success()
    })
}

fastGamemode(GameMode.adventure, 'a')
fastGamemode(GameMode.creative, 'c')
fastGamemode(GameMode.spectator, 'ss')
fastGamemode(GameMode.survival, 's')

new Command('repair')
  .setPermissions('techAdmin')
  .setDescription('Чинит предмет')
  .executes(ctx => {
    const item = ctx.player.mainhand().getItem()
    if (!item) return ctx.error('В руке нет предмета.')

    const durability = item.durability
    if (!durability) return ctx.error('Этот предмет невозможно починить.')

    durability.damage = 0
    ctx.player.mainhand().setItem(item)
  })

function fastEffect(effect: MinecraftEffectTypes, commandName: string, effectName: string) {
  new Command(commandName)
    .setPermissions('builder')
    .setDescription('Выдает эффект ' + effectName)
    .int('amlifier', true)
    .executes((ctx, amplifier = 1) => {
      if (!isNotPlaying(ctx.player)) return ctx.error('Вы не можете совершить это действие вне режима строительства')

      if (ctx.player.getEffect(effect)) {
        ctx.player.removeEffect(effect)
      } else {
        ctx.player.addEffect(effect, 99999, {
          amplifier,
        })
      }
    })
}

fastEffect(MinecraftEffectTypes.NightVision, 'night', 'ночного зрения')
fastEffect(MinecraftEffectTypes.Speed, 'speed', 'скорости')

new Command('heal')
  .setPermissions(__RELEASE__ ? 'techAdmin' : 'builder')
  .setDescription('Восстанавливает хп')
  .executes(ctx => {
    const item = ctx.player.getComponent('health')
    if (!item) return ctx.error('Вы мертвы.')

    item.resetToMaxValue()
  })

new Command('eat')
  .setPermissions(__RELEASE__ ? 'techAdmin' : 'builder')
  .setDescription('Восстанавливает голод')
  .executes(ctx => {
    ctx.player.addEffect(MinecraftEffectTypes.Saturation, 2, { amplifier: 255 })
  })

const hpie = new WeakPlayerMap<Temporary>({
  removeOnLeave: true,
  onLeave: (_, temp) => temp.cleanup(),
})

new Command('hpi')
  .setPermissions('techAdmin')
  .setDescription('Используйте чтобы включить инспектор сущностей')
  .executes(ctx => {
    const hpi = hpie.get(ctx.player.id)
    if (hpi) {
      hpi.cleanup()
      hpie.delete(ctx.player.id)
      ctx.player.success()
    } else {
      hpie.set(
        ctx.player.id,
        new Temporary(({ system }) => {
          system.runInterval(
            () => {
              const hit = ctx.player.getEntitiesFromViewDirection()[0]
              if (typeof hit === 'undefined') return

              ctx.player.onScreenDisplay.setActionBar(
                t`HP: ${hit.entity.getComponent('health')?.currentValue ?? 0}/${hit.entity.getComponent('health')?.effectiveMax} TP: ${hit.entity.typeId.replace('minecraft:', '')}\nID: ${hit.entity.id}`,
                ActionbarPriority.UrgentNotificiation,
              )
            },
            'hpi',
            10,
          )
        }),
      )
      ctx.player.success('Наведитесь на сущность чтобы узнать ее данные')
    }
  })

new Command('version')
  .setAliases('v')
  .setDescription('Версия сервера')
  .executes(ctx => {
    ctx.reply(
      textTable({
        'Версия майнкрафта': '1.21.2',
        'Версия сервера': '1.21.3',
      }),
    )

    if (is(ctx.player.id, 'techAdmin')) {
      ctx.reply(
        textTable({
          Коммит: __GIT__,
          Разработка: __DEV__,
          Релиз: __RELEASE__,
        }),
      )
    }
  })

const rtpPlayers = new WeakPlayerMap<Vector3>()
new LockAction(player => rtpPlayers.has(player), 'Вы телепортируетесь!')

function cancelRtp(player: Player) {
  const location = rtpPlayers.get(player)
  if (!location) return player.fail('Вы не телепортируетесь!')

  rtpComplete(player, location)
}

function rtpComplete(player: Player, location: Vector3) {
  rtpPlayers.delete(player)
  player.teleport(location)
  player.removeEffect(MinecraftEffectTypes.SlowFalling)
}

new Command('rtp')
  .setAliases('wild')
  .setDescription('Телепортация в случайное место на анархии')
  .setPermissions('member')
  .executes(ctx => {
    if (ctx.player.dimension.type !== 'overworld' || ctx.player.database.inv !== 'anarchy')
      return ctx.error('Недоступно')
    if (LockAction.locked(ctx.player)) return

    rtpPlayers.set(ctx.player, ctx.player.location)

    randomLocationInAnarchy({
      info: info => ctx.player.onScreenDisplay.setActionBar(info, ActionbarPriority.UrgentNotificiation),
      onBlock: block => {
        ctx.player.addEffect(MinecraftEffectTypes.SlowFalling, 200 * TicksPerSecond, { amplifier: 100 })
        ctx.player.teleport(block)
      },
    }).then(location => {
      if (!location) return cancelRtp(ctx.player)

      rtpComplete(ctx.player, Vector.add(location.topmost, Vector.up))
    })
  })
  .overload('cancel')
  .setDescription('Отменяет телепортацию')
  .setPermissions('member')
  .executes(ctx => {
    cancelRtp(ctx.player)
  })
