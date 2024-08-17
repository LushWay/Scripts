import { world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { Temporary } from 'lib'
import { Enchantments } from 'lib/enchantments'
import { t } from 'lib/text'
import { WeakPlayerMap } from 'lib/weak-player-storage'

new Command('enchant')
  .setDescription('Зачаровывает предмет')
  .setPermissions('admin')
  .string('enchantName', true)
  .int('level')
  .executes((ctx, enchant, level) => {
    if (!enchant || !(enchant in Enchantments.custom)) return ctx.reply(Object.keys(Enchantments.custom).join('\n'))
    const ench = Enchantments.custom[enchant]
    const mainhand = ctx.player.mainhand()
    const item = mainhand.getItem()

    if (!item) return ctx.error('No item!')

    const enchlevels = ench[level]
    if (typeof enchlevels === 'undefined')
      return ctx.error('Level unavailable. Levels:\n' + Object.keys(ench).join('\n'))

    const enchitem = enchlevels[item.typeId]
    if (typeof enchitem === 'undefined') return ctx.error('Available items:\n' + Object.keys(enchitem).join('\n'))

    const enchantments = item.getComponent('enchantable')
    if (!enchantments) return ctx.error('Not enchantable!')

    const newitem = enchitem.clone()

    newitem.enchantable?.addEnchantments(enchantments.getEnchantments().filter(e => e.type.id !== enchant))
    newitem.nameTag = item.nameTag
    newitem.amount = item.amount
    if (newitem.durability && item.durability) newitem.durability.damage = item.durability.damage
    newitem.setLore(item.getLore())
    newitem.setCanDestroy(item.getCanDestroy())
    newitem.setCanPlaceOn(item.getCanPlaceOn())
    newitem.keepOnDeath = item.keepOnDeath
    newitem.lockMode = item.lockMode
    for (const prop of item.getDynamicPropertyIds()) newitem.setDynamicProperty(prop, item.getDynamicProperty(prop))

    if (newitem.enchantable) world.debug('enchants', [...newitem.enchantable.getEnchantments()])

    mainhand.setItem(newitem)
  })

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

new Command('heal')
  .setPermissions('techAdmin')
  .setDescription('Восстанавливает хп')
  .executes(ctx => {
    const item = ctx.player.getComponent('health')
    if (!item) return ctx.error('Вы мертвы.')

    item.resetToMaxValue()
  })

new Command('eat')
  .setPermissions('techAdmin')
  .setDescription('Восстанавливает голод')
  .executes(ctx => {
    ctx.player.addEffect(MinecraftEffectTypes.Saturation, 2, { amplifier: 255 })
  })

const hpie = new WeakPlayerMap<Temporary>({
  removeOnLeave: true,
  onLeave(playerId, setValue) {
    setValue.cleanup()
  },
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
                t`HP: ${hit.entity.getComponent('health')?.currentValue ?? 0}/${hit.entity.getComponent('health')?.effectiveMax} TP: ${hit.entity.typeId.replace('minecraft:', '')}`,
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
