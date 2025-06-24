/* i18n-ignore */

import { GameMode } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { is, isNotPlaying, Temporary } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/i18n/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'

function fastGamemode(mode: GameMode, shorname: string) {
  new Command(shorname)
    .setDescription('Переключает режим на ' + mode)
    .setPermissions('builder')
    .executes(ctx => {
      ctx.player.success(t`${shorname}: ${ctx.player.getGameMode()} -> ${mode}`)
      ctx.player.setGameMode(mode)
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
      if (!isNotPlaying(ctx.player) && !is(ctx.player.id, 'techAdmin'))
        return ctx.error('Вы не можете совершить это действие вне режима строительства')

      const has = ctx.player.getEffect(effect)
      if (has?.amplifier === amplifier) {
        log()
        ctx.player.removeEffect(effect)
      } else {
        if (has) {
          log()
          ctx.player.removeEffect(effect)
        }
        log()
        ctx.player.addEffect(effect, 20000000, { amplifier, showParticles: false })
      }

      function log() {
        const current = ctx.player.getEffect(effect)
        const effectname = Object.entries(MinecraftEffectTypes).find(e => e[1] === effect)?.[0]
        if (current) {
          ctx.player.success(t`${'§c-'} ${effectname} ${current.amplifier}`)
        } else {
          ctx.player.success(t`${'§a+'} ${effectname} ${amplifier}`)
        }
      }
    })
}

fastEffect(MinecraftEffectTypes.NightVision, 'night', 'ночного зрения')
fastEffect(MinecraftEffectTypes.Speed, 'speed', 'скорости')
fastEffect(MinecraftEffectTypes.Haste, 'haste', 'скорости копания')

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
                ActionbarPriority.Highest,
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
