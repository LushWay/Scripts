import { GameMode } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { isNotPlaying, Temporary } from 'lib'
import { t } from 'lib/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'

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
      if (isNotPlaying(ctx.player)) return ctx.error('Вы не можете совершить это действие вне режима строительства')
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
